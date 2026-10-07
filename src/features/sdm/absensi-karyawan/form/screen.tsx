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
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { formatDate } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { useAbsensiDetail, useDeleteAbsensi, useSaveAbsensi } from "../api";
import {
  ABSENSI_LIST_PATH,
  DELETE_CONFIRM,
  EMPTY_ABSENSI_FORM,
  NOUN,
  absensiFormSchema,
  serverFieldError,
  toAbsensiForm,
  toAbsensiPayload,
  type AbsensiFormValues,
} from "../model";

import { AbsensiSection } from "./absensi-section";

const BACK_LABEL = "Kembali ke Absensi Karyawan";

interface PropTypes {
  publicId?: string;
}

export const AbsensiFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.ABSENSI_KARYAWAN,
  );
  const listReturn = useListReturn(ABSENSI_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveAbsensi = useSaveAbsensi(publicId);
  const deleteAbsensi = useDeleteAbsensi(publicId);
  const detail = useAbsensiDetail(isCanUpdate ? publicId : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<AbsensiFormValues>({
    resolver: zodResolver(absensiFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_ABSENSI_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteAbsensi.isPending;

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
    deleteAbsensi.reset();
    setRejectedField(null);

    try {
      const saved = await saveAbsensi.mutateAsync(toAbsensiPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(ABSENSI_LIST_PATH, saved.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteAbsensi.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toAbsensiForm(detail.data));
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
    if (deleteAbsensi.isError) deleteRef.current?.focus();
  }, [deleteAbsensi.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah absensi karyawan"
            : "Tidak bisa menambah absensi karyawan"
        }
        description="Peran Anda hanya bisa melihat data absensi karyawan."
        isCanView={isCanView}
        backHref={ABSENSI_LIST_PATH}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound noun={NOUN} backHref={listReturn} backLabel={BACK_LABEL} />
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
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteAbsensi.isPending ? "Menghapus…" : "Hapus"}
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
            disabled={isBusy || detail.isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Absensi Karyawan" : "Tambah Absensi Karyawan"}
          subtitle={
            detail.data
              ? `${detail.data.karyawan.name} · ${formatDate(detail.data.date)}`
              : undefined
          }
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={6} label="Memuat data absensi karyawan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <AbsensiSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteAbsensi.error ? (
          <FormAlert
            title="Absensi karyawan belum terhapus."
            message={deleteAbsensi.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun={NOUN}
        descriptions={{ delete: DELETE_CONFIRM }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
