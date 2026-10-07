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
  useFormConfirm,
  NoFormAccess,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useDeleteRiwayat, useRiwayatDetail, useSaveRiwayat } from "../api";
import {
  EMPTY_RIWAYAT_FORM,
  RIWAYAT_LIST_PATH,
  riwayatFormSchema,
  serverFieldError,
  toRiwayatForm,
  toRiwayatPayload,
  type RiwayatFormValues,
} from "../model";

import { JemaatSection } from "./jemaat-section";
import { RiwayatSection } from "./riwayat-section";

interface PropTypes {
  id?: string;
}

export const RiwayatFormScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.RIWAYAT_JEMAAT,
  );
  const listReturn = useListReturn(RIWAYAT_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRiwayat = useSaveRiwayat(id);
  const deleteRiwayat = useDeleteRiwayat(id);
  const detail = useRiwayatDetail(id);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RiwayatFormValues>({
    resolver: zodResolver(riwayatFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_RIWAYAT_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteRiwayat.isPending;

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
    deleteRiwayat.reset();
    setRejectedField(null);

    try {
      const saved = await saveRiwayat.mutateAsync(toRiwayatPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(RIWAYAT_LIST_PATH, saved.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteRiwayat.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toRiwayatForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isBusy) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isBusy]);

  // Ditunda sampai fieldset aktif lagi: kontrol yang disabled menolak fokus.
  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah riwayat" : "Tidak bisa mencatat riwayat"
        }
        description={`Peran Anda hanya bisa melihat riwayat jemaat. ${isEdit ? "Perubahan riwayat" : "Pencatatan riwayat baru"} biasanya dikerjakan sekretariat.`}
        backHref={RIWAYAT_LIST_PATH}
        backLabel="Kembali ke Riwayat Jemaat"
        isCanView={isCanView}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="riwayat jemaat"
        backHref={listReturn}
        backLabel="Kembali ke Riwayat Jemaat"
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
              type="button"
              variant="destructive"
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteRiwayat.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Riwayat Jemaat" : "Catat Riwayat Jemaat"}
          subtitle={detail.data?.jemaat.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={5} label="Memuat data riwayat jemaat…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <JemaatSection
          form={form}
          isDisabled={isBusy}
          pinned={
            detail.data
              ? {
                  value: detail.data.jemaat.code,
                  label: detail.data.jemaat.name,
                }
              : null
          }
        />
        <RiwayatSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Riwayat belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteRiwayat.error ? (
          <FormAlert
            title="Riwayat belum terhapus. Coba hapus lagi."
            message={
              deleteRiwayat.error instanceof FetchError
                ? deleteRiwayat.error.message
                : "Tidak dapat menghubungi server. Periksa koneksi Anda."
            }
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="riwayat jemaat"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
