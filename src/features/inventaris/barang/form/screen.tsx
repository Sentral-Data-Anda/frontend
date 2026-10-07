"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  FormNotFound,
  LoadingForm,
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { withFreshUrls } from "@/lib/attachment";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useAssetDetail, useDeleteAsset, useSaveAsset } from "../api";
import {
  BARANG_LIST_PATH,
  EMPTY_ASSET_FORM,
  assetFormSchema,
  barangDetailHref,
  isActiveAsset,
  serverFieldError,
  toAssetForm,
  toAssetFormData,
  toFormError,
  type AssetFormValues,
} from "../model";

import { AcquisitionSection } from "./acquisition-section";
import { DepreciationSection } from "./depreciation-section";
import { IdentitySection } from "./identity-section";
import { LocationSection } from "./location-section";
import { PhotosSection } from "./photos-section";

const DELETE_DESCRIPTION =
  "Apakah Anda ingin menghapus barang ini? Hapus hanya untuk data yang salah catat. Barang yang dijual, rusak, atau hilang diajukan lewat Pelepasan di Siklus Aset.";

interface PropTypes {
  code?: string;
}

export const BarangFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.BARANG,
  );
  const listReturn = useListReturn(BARANG_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [pickLeaveHref, setPickLeaveHref] = useState<string | null>(null);
  const saveAsset = useSaveAsset(code);
  const deleteAsset = useDeleteAsset(code);
  const detail = useAssetDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_ASSET_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const saved = detail.data;
  const isBusy = isSubmitting || deleteAsset.isPending;
  const isHidden = isEdit && !saved;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const isDepreciationLocked = Boolean(saved?.depreciation?.lastPeriod);
  const deleteError = deleteAsset.error;

  const onLeaveToList = () => router.replace(listReturn);

  const onLeave = () =>
    pickLeaveHref ? router.push(pickLeaveHref) : onLeaveToList();

  const onCancel = () => {
    setPickLeaveHref(null);
    confirm.onCancel(isDirty, onLeaveToList);
  };

  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    setPickLeaveHref(null);
    confirm.onBack(isDirty)(event);
  };

  const onLeaveTo = (href: string) => {
    setPickLeaveHref(href);
    confirm.onCancel(isDirty, () => router.push(href));
  };

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteAsset.reset();
    setRejectedField(null);

    try {
      const response = await saveAsset.mutateAsync(
        toAssetFormData(values, isEdit),
      );

      toast.add({ title: response.message });
      saveListFocus(BARANG_LIST_PATH, response.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(toFormError(error), form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteAsset.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onRetryDetail = () => void detail.refetch();

  // Refetch berkala hanya memperbarui URL foto bertanda tangan; isian user tetap.
  useEffect(() => {
    if (!detail.data) return;

    form.reset(toAssetForm(detail.data), { keepDirtyValues: true });
    form.setValue(
      "mainImage",
      withFreshUrls(
        form.getValues("mainImage"),
        detail.data.mainImage ? [detail.data.mainImage] : [],
      ),
    );
    form.setValue(
      "detailImage",
      withFreshUrls(form.getValues("detailImage"), detail.data.detailImage),
    );
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  useEffect(() => {
    if (deleteAsset.isError) deleteRef.current?.focus();
  }, [deleteAsset.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah barang" : "Tidak bisa menambah barang"
        }
        description="Peran Anda hanya bisa melihat data barang."
        isCanView={isCanView}
        backHref={BARANG_LIST_PATH}
        backLabel="Kembali ke Barang"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="barang"
        backHref={listReturn}
        backLabel="Kembali ke Barang"
      />
    );
  }

  if (saved && !isActiveAsset(saved)) {
    return (
      <NoFormAccess
        title="Barang tidak bisa diubah"
        description="Barang yang sudah dilepas atau sedang diajukan lepas tidak bisa diubah."
        backHref={barangDetailHref(saved.code)}
        backLabel="Kembali ke halaman barang"
        isStateLocked
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isEdit && isCanDelete ? (
            <Button
              ref={deleteRef}
              type="button"
              variant="destructive"
              disabled={isLocked}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteAsset.isPending ? "Menghapus…" : "Hapus"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={onCancel}
          >
            Batal
          </Button>

          <Button ref={saveRef} type="submit" disabled={isLocked}>
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Barang" : "Tambah Barang"}
          subtitle={saved ? `${saved.name} · ${saved.code}` : code}
          backHref={listReturn}
          isBackPersistent
          onBack={onBack}
        />
      }
    >
      {detail.error && !isNotFound && !saved ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data barang gagal dimuat."
            message="Form belum bisa diisi sampai datanya termuat."
          />
          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={onRetryDetail}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      {detail.isLoading ? (
        <LoadingForm fields={8} label="Memuat data barang…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <IdentitySection form={form} isDisabled={isBusy} />
        <LocationSection
          form={form}
          isDisabled={isBusy}
          saved={saved}
          onLeaveTo={onLeaveTo}
        />
        <AcquisitionSection
          form={form}
          isDisabled={isBusy}
          isDepreciationLocked={isDepreciationLocked}
        />
        <DepreciationSection
          form={form}
          isDisabled={isBusy}
          isLocked={isDepreciationLocked}
        />
        <PhotosSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteError ? (
          <FormAlert
            title="Barang belum terhapus."
            message={deleteError.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="barang"
        descriptions={{ delete: DELETE_DESCRIPTION }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
