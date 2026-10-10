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
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  useAllocationDetail,
  useBudgetSetting,
  useDeleteAllocation,
  useSaveAllocation,
  useSaveAllocationBatch,
} from "../api";
import {
  NO_VIEW,
  PAGU_LIST_PATH,
  allocationDeleteText,
  allocationDetailHref,
  allocationFormSchema,
  batchFormSchema,
  emptyAllocationForm,
  emptyBatchForm,
  errorFixOf,
  toAllocationForm,
  toAllocationPayload,
  toBatchPayload,
  yearSelectOptions,
  type AllocationFormValues,
  type BatchFormValues,
} from "../model";

import { BatchSection } from "./batch-section";
import { CeilingSection } from "./ceiling-section";

interface PropTypes {
  publicId?: string;
}

export const AllocationFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.BUDGET,
  );
  const isBatch = useBoolean();
  const listReturn = useListReturn(PAGU_LIST_PATH);
  const leaveHref = publicId ? allocationDetailHref(publicId) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const setting = useBudgetSetting();
  const detail = useAllocationDetail(isCanUpdate ? publicId : undefined);
  const saveAllocation = useSaveAllocation(publicId);
  const saveBatch = useSaveAllocationBatch();
  const deleteAllocation = useDeleteAllocation(publicId);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const yearOptions = yearSelectOptions(setting.data?.budgetYears ?? []);
  const defaultYear = setting.data ? String(setting.data.budgetYear.year) : "";

  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(allocationFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyAllocationForm(""),
  });

  const batchForm = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyBatchForm(""),
  });

  const active = isBatch.value ? batchForm : form;
  const { isDirty, isSubmitting, submitCount } = active.formState;
  const rootError = active.formState.errors.root?.message;
  const deleteFix = errorFixOf(deleteAllocation.error);
  const isBusy = isSubmitting || deleteAllocation.isPending;
  const isDeletable = isEdit && isCanDelete;

  const onLeave = () => router.replace(leaveHref);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen(isEdit ? "update" : "save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (isBatch.value
      ? batchForm.handleSubmit(onOpenSaveConfirm, onInvalid)()
      : form.handleSubmit(onOpenSaveConfirm, onInvalid)());
  };

  const onSaveSingle = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    deleteAllocation.reset();
    setRejectedField(null);

    try {
      const saved = await saveAllocation.mutateAsync(
        toAllocationPayload(values),
      );

      toast.add({ title: saved.message });
      saveListFocus(PAGU_LIST_PATH, saved.data.publicId);
      router.replace(allocationDetailHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  const onSaveBatch = batchForm.handleSubmit(async (values) => {
    batchForm.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await saveBatch.mutateAsync(toBatchPayload(values));

      toast.add({ title: saved.message });
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, batchForm.setError));
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteAllocation.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) {
      form.reset(toAllocationForm(detail.data), { keepDirtyValues: true });
    }
  }, [detail.data, form]);

  useEffect(() => {
    if (isEdit || !defaultYear) return;

    form.setValue("year", defaultYear);
    batchForm.setValue("year", defaultYear);
  }, [isEdit, defaultYear, form, batchForm]);

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
    if (deleteAllocation.isError) deleteRef.current?.focus();
  }, [deleteAllocation.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah pagu anggaran"
            : "Tidak bisa menambah pagu anggaran"
        }
        description={
          isCanView
            ? "Peran Anda hanya bisa melihat data pagu anggaran."
            : NO_VIEW
        }
        backHref={leaveHref}
        backLabel="Kembali ke Pagu Anggaran"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="pagu anggaran"
        backHref={listReturn}
        backLabel="Kembali ke Pagu Anggaran"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions>
          {isDeletable ? (
            <Button
              ref={deleteRef}
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => confirm.onOpen("delete")}
              isLoading={deleteAllocation.isPending}
            >
              {deleteAllocation.isPending ? "Menghapus…" : "Hapus"}
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
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Pagu Anggaran" : "Tambah Pagu Anggaran"}
          subtitle={detail.data?.bapel?.name ?? undefined}
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
          action={
            isEdit ? null : (
              <Button
                type="button"
                variant="outline"
                aria-pressed={isBatch.value}
                onClick={isBatch.onToggle}
              >
                {isBatch.value ? "Satu pagu" : "Beberapa pagu"}
              </Button>
            )
          }
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={3} label="Memuat data pagu anggaran…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        {isBatch.value ? (
          <BatchSection
            form={batchForm}
            yearOptions={yearOptions}
            isDisabled={isBusy}
          />
        ) : (
          <CeilingSection
            form={form}
            yearOptions={yearOptions}
            isDisabled={isBusy}
          />
        )}
      </div>

      <div className="space-y-2 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteAllocation.error ? (
          <FormAlert
            title="Pagu anggaran belum terhapus."
            message={deleteAllocation.error.message}
          />
        ) : null}

        {deleteFix ? <p className="text-body">{deleteFix}</p> : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="pagu anggaran"
        descriptions={
          detail.data
            ? { delete: allocationDeleteText(detail.data) }
            : undefined
        }
        onSave={() => void (isBatch.value ? onSaveBatch() : onSaveSingle())}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
