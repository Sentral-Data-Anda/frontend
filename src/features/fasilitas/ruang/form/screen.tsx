"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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

import { useDeleteRuang, useRuangDetail, useSaveRuang } from "../api";
import {
  EMPTY_RUANG_FORM,
  RUANG_LIST_PATH,
  ruangFormSchema,
  serverFieldError,
  toFormError,
  toRuangForm,
  toRuangFormData,
  type RuangFormValues,
} from "../model";

import { PhotosSection } from "./photos-section";
import { RoomSection } from "./room-section";

const DELETE_DESCRIPTION =
  "Apakah Anda ingin menghapus ruang ini? Riwayat pemakaiannya tetap tersimpan. Untuk berhenti meminjamkan sementara, ubah statusnya menjadi Nonaktif.";

const IN_USE_HINT =
  "Bila ruang ini tidak dipinjamkan lagi, ubah statusnya menjadi Nonaktif lalu simpan.";

interface PropTypes {
  code?: string;
}

export const RuangFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.RUANG,
  );
  const listReturn = useListReturn(RUANG_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRuang = useSaveRuang(code);
  const deleteRuang = useDeleteRuang(code);
  const detail = useRuangDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RuangFormValues>({
    resolver: zodResolver(ruangFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_RUANG_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteRuang.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const deleteError = deleteRuang.error;
  const isInUse =
    deleteError instanceof FetchError && deleteError.status === 400;

  const onLeave = () => router.replace(listReturn);

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
    deleteRuang.reset();
    setRejectedField(null);

    try {
      const saved = await saveRuang.mutateAsync(
        toRuangFormData(values, isEdit),
      );

      toast.add({ title: saved.message });
      saveListFocus(RUANG_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(toFormError(error), form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteRuang.mutate(undefined, {
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

    form.reset(toRuangForm(detail.data), { keepDirtyValues: true });
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
    if (deleteRuang.isError) deleteRef.current?.focus();
  }, [deleteRuang.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah ruang" : "Tidak bisa menambah ruang"
        }
        description="Peran Anda hanya bisa melihat data ruang."
        isCanView={isCanView}
        backHref={RUANG_LIST_PATH}
        backLabel="Kembali ke Ruang"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="ruang"
        backHref={listReturn}
        backLabel="Kembali ke Ruang"
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
              {deleteRuang.isPending ? "Menghapus…" : "Hapus"}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
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
          title={isEdit ? "Ubah Ruang" : "Tambah Ruang"}
          subtitle={detail.data?.name ?? code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.error && !isNotFound && !detail.data ? (
        <div className="flex flex-col items-start gap-2 px-gutter pt-4">
          <FormAlert
            title="Data ruang gagal dimuat."
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
        <LoadingForm fields={5} label="Memuat data ruang…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <RoomSection form={form} isDisabled={isBusy} />
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
            title="Ruang belum terhapus."
            message={
              isInUse
                ? `${deleteError.message}. ${IN_USE_HINT}`
                : deleteError.message
            }
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="ruang"
        descriptions={{ delete: DELETE_DESCRIPTION }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
