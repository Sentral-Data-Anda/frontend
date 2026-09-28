"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { newAttachments } from "@/lib/attachment";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useDeleteGaleri, useGaleriDetail, useSaveGaleri } from "../api";
import {
  EMPTY_GALERI_FORM,
  GALERI_LIST_PATH,
  galeriFormSchema,
  replaceDescriptionOf,
  serverFieldError,
  toGaleriForm,
  toGaleriFormData,
  type GaleriFormValues,
} from "../model";

import { AlbumSection } from "./album-section";
import { PhotosSection } from "./photos-section";

interface PropTypes {
  code?: string;
}

export const GaleriFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(MENU.GALERI);
  const listReturn = useListReturn(GALERI_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveGaleri = useSaveGaleri(code);
  const deleteGaleri = useDeleteGaleri(code);
  const detail = useGaleriDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<GaleriFormValues>({
    resolver: zodResolver(galeriFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_GALERI_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const [bapelId, isPickingPhotos, listImage] = useWatch({
    control: form.control,
    name: ["bapelId", "isPickingPhotos", "listImage"],
  });
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteGaleri.isPending;
  const isDetailMissing = isEdit && !detail.data;
  const newCount = newAttachments(listImage).length;

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
    deleteGaleri.reset();
    setRejectedField(null);

    try {
      const saved = await saveGaleri.mutateAsync(toGaleriFormData(values));

      toast.add({ title: saved.message });
      saveListFocus(GALERI_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteGaleri.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  // Detail dimuat ulang berkala demi URL foto baru; isian yang sedang diubah tidak ditimpa.
  useEffect(() => {
    if (detail.data && !form.formState.isDirty) {
      form.reset(toGaleriForm(detail.data));
    }
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
    if (deleteGaleri.isError) deleteRef.current?.focus();
  }, [deleteGaleri.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah album" : "Tidak bisa menambah album"
        }
        description="Peran Anda hanya bisa melihat galeri."
        backHref={GALERI_LIST_PATH}
        backLabel="Kembali ke Galeri"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="album"
        backHref={listReturn}
        backLabel="Kembali ke Galeri"
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
              disabled={isBusy || isDetailMissing}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteGaleri.isPending ? "Menghapus…" : "Hapus"}
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

          <Button
            ref={saveRef}
            type="submit"
            disabled={isBusy || isDetailMissing}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Album" : "Tambah Album"}
          subtitle={detail.data?.name ?? code}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={3} label="Memuat data album…" />
      ) : null}

      <div className={isDetailMissing ? "hidden" : undefined}>
        <AlbumSection form={form} bapelId={bapelId} isDisabled={isBusy} />
        <PhotosSection
          form={form}
          savedPhotos={detail.data?.listImage ?? null}
          isDisabled={isBusy}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {detail.error && !detail.data ? (
          <FormAlert
            title="Data album belum termuat."
            message={detail.error.message}
          />
        ) : null}

        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteGaleri.error ? (
          <FormAlert
            title="Album belum terhapus."
            message={deleteGaleri.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="album"
        descriptions={
          isEdit && isPickingPhotos && newCount > 0
            ? { update: replaceDescriptionOf(newCount) }
            : undefined
        }
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
