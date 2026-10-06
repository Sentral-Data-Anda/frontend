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
import { saveListFocus } from "@/lib/list-return";

import { useDeleteKaryawan, useKaryawanDetail, useSaveKaryawan } from "../api";
import {
  EMPTY_KARYAWAN_FORM,
  KARYAWAN_LIST_PATH,
  karyawanFormSchema,
  serverFieldError,
  toKaryawanForm,
  toKaryawanPayload,
  type KaryawanFormValues,
} from "../model";

import { ContactSection } from "./contact-section";
import { EmploymentSection } from "./employment-section";
import { IdentitySection } from "./identity-section";

interface PropTypes {
  code?: string;
}

export const KaryawanFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.KARYAWAN,
  );
  const listReturn = useListReturn(KARYAWAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveKaryawan = useSaveKaryawan(code);
  const deleteKaryawan = useDeleteKaryawan(code);
  const detail = useKaryawanDetail(code);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<KaryawanFormValues>({
    resolver: zodResolver(karyawanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_KARYAWAN_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteKaryawan.isPending;
  const pinned = detail.data?.jemaat
    ? {
        value: String(detail.data.jemaat.id),
        label: detail.data.jemaat.name,
      }
    : null;

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
    deleteKaryawan.reset();
    setRejectedField(null);

    try {
      const saved = await saveKaryawan.mutateAsync(toKaryawanPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(KARYAWAN_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteKaryawan.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toKaryawanForm(detail.data));
  }, [detail.data, form]);

  useEffect(() => {
    if (!isDirty || isSubmitting) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") saveRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  useEffect(() => {
    if (deleteKaryawan.isError) deleteRef.current?.focus();
  }, [deleteKaryawan.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah karyawan"
            : "Tidak bisa menambah karyawan"
        }
        description="Peran Anda hanya bisa melihat data karyawan."
        backHref={KARYAWAN_LIST_PATH}
        backLabel="Kembali ke Karyawan"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="karyawan"
        backHref={listReturn}
        backLabel="Kembali ke Karyawan"
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
              disabled={isBusy || detail.isLoading}
              onClick={() => confirm.onOpen("delete")}
            >
              {deleteKaryawan.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Karyawan" : "Tambah Karyawan"}
          subtitle={detail.data?.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={10} label="Memuat data karyawan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <IdentitySection
          form={form}
          isDisabled={isBusy}
          code={detail.data?.code}
          pinned={pinned}
        />
        <ContactSection form={form} isDisabled={isBusy} />
        <EmploymentSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteKaryawan.error ? (
          <FormAlert
            title="Karyawan belum terhapus."
            message={deleteKaryawan.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="karyawan"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
