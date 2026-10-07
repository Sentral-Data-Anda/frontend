"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/common/control";
import { SalaryDataBadge } from "@/components/common/display";
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

import {
  useDeletePenetapan,
  usePenetapanDetail,
  useSavePenetapan,
} from "../api";
import {
  EMPTY_PENETAPAN_FORM,
  PENETAPAN_LIST_PATH,
  penetapanFormSchema,
  penetapanServerFieldError,
  toPenetapanForm,
  toPenetapanPayload,
  type PenetapanFormValues,
} from "../model";

import { PenetapanSection } from "./penetapan-section";

const BACK_LABEL = "Kembali ke Penetapan";

interface PropTypes {
  publicId?: string;
}

export const PenetapanFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.KOMPONEN_PAYROLL,
  );
  const listReturn = useListReturn(PENETAPAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveAssignment = useSavePenetapan(publicId);
  const deleteAssignment = useDeletePenetapan(publicId);
  const detail = usePenetapanDetail(isCanUpdate ? publicId : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<PenetapanFormValues>({
    resolver: zodResolver(penetapanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_PENETAPAN_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteAssignment.isPending;

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
    deleteAssignment.reset();
    setRejectedField(null);

    try {
      const saved = await saveAssignment.mutateAsync(
        toPenetapanPayload(values),
      );

      toast.add({ title: saved.message });
      saveListFocus(PENETAPAN_LIST_PATH, saved.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, penetapanServerFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteAssignment.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toPenetapanForm(detail.data));
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
    if (deleteAssignment.isError) deleteRef.current?.focus();
  }, [deleteAssignment.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah penetapan"
            : "Tidak bisa menambah penetapan"
        }
        description="Peran Anda hanya bisa melihat penetapan komponen."
        isCanView={isCanView}
        backHref={PENETAPAN_LIST_PATH}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="penetapan komponen"
        backHref={listReturn}
        backLabel={BACK_LABEL}
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
              {deleteAssignment.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Penetapan" : "Tambah Penetapan"}
          subtitle={detail.data?.karyawan.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
          action={<SalaryDataBadge />}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={5} label="Memuat penetapan komponen…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <PenetapanSection
          form={form}
          isDisabled={isBusy}
          assignment={detail.data}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteAssignment.error ? (
          <FormAlert
            title="Penetapan belum terhapus."
            message={deleteAssignment.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="penetapan komponen"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
