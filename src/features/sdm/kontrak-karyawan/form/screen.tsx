"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/common/control";
import { SalaryDataBadge } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
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
import { StepUpDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useDeleteKontrak, useKontrakDetail, useSaveKontrak } from "../api";
import {
  EMPTY_KONTRAK_FORM,
  LIST_PATH,
  LOCKED_DESCRIPTION,
  LOCKED_TITLE,
  STEP_UP_DESCRIPTION,
  kontrakFormSchema,
  kontrakServerFieldError,
  toKontrakForm,
  toKontrakPayload,
  type KontrakFormValues,
} from "../model";
import { useSalaryLock } from "../use-salary-lock";

import { EmployeeSection } from "./employee-section";
import { JobSection } from "./job-section";
import { PeriodSection } from "./period-section";

const BACK_LABEL = "Kembali ke Kontrak Karyawan";

interface PropTypes {
  code?: string;
}

export const KontrakFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.EMPLOYEE_CONTRACT,
  );
  const listReturn = useListReturn(LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveContract = useSaveKontrak(code);
  const deleteContract = useDeleteKontrak(code);
  const detail = useKontrakDetail(isCanUpdate ? code : undefined);
  const lock = useSalaryLock(detail.error, () => void detail.refetch());
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<KontrakFormValues>({
    resolver: zodResolver(kontrakFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_KONTRAK_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteContract.isPending;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  // Muat yang gagal di luar 404 dan di luar step-up: formnya tetap form ubah,
  // tapi isinya bukan kontrak itu, jadi tidak boleh disimpan.
  const isDetailBroken = detail.isError && !isNotFound && !lock.isLocked;

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
    deleteContract.reset();
    setRejectedField(null);

    try {
      const saved = await saveContract.mutateAsync(toKontrakPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, kontrakServerFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteContract.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) form.reset(toKontrakForm(detail.data));
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
    if (deleteContract.isError) deleteRef.current?.focus();
  }, [deleteContract.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit ? "Tidak bisa mengubah kontrak" : "Tidak bisa menambah kontrak"
        }
        description="Peran Anda hanya bisa melihat kontrak karyawan."
        isCanView={isCanView}
        backHref={LIST_PATH}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (lock.isLocked) {
    return (
      <div className="pb-6">
        <PageHeader
          title="Ubah Kontrak Karyawan"
          backHref={listReturn}
          isBackPersistent
          action={<SalaryDataBadge />}
        />

        <EmptyState
          title={LOCKED_TITLE}
          description={LOCKED_DESCRIPTION}
          action={
            <Button type="button" onClick={lock.onAsk}>
              Masukkan password
            </Button>
          }
        />

        <StepUpDialog
          isOpen={lock.isAsking}
          onClose={lock.onClose}
          onVerified={lock.onVerified}
          description={STEP_UP_DESCRIPTION}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="kontrak karyawan"
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
              disabled={isBusy || detail.isLoading || isDetailBroken}
              onClick={() => confirm.onOpen("delete")}
              isLoading={deleteContract.isPending}
            >
              {deleteContract.isPending ? "Menghapus…" : "Hapus"}
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
            disabled={isBusy || detail.isLoading || isDetailBroken}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Kontrak Karyawan" : "Tambah Kontrak Karyawan"}
          subtitle={detail.data?.karyawan.name}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
          action={<SalaryDataBadge />}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={6} label="Memuat kontrak karyawan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <EmployeeSection
          form={form}
          isDisabled={isBusy}
          isEdit={isEdit}
          code={code}
          contract={detail.data}
        />
        <JobSection form={form} isDisabled={isBusy} />
        <PeriodSection form={form} isDisabled={isBusy} contract={detail.data} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {isDetailBroken ? (
          <div className="space-y-3">
            <FormAlert
              title="Kontrak ini belum bisa dimuat."
              message={detail.error?.message ?? ""}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => void detail.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        ) : null}

        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteContract.error ? (
          <FormAlert
            title="Kontrak belum terhapus."
            message={deleteContract.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="kontrak karyawan"
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
