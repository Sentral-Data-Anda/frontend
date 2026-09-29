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
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useDeleteSupplier, useSaveSupplier, useSupplierDetail } from "../api";
import {
  EMPTY_SUPPLIER_FORM,
  SUPPLIER_LIST_PATH,
  serverFieldError,
  supplierFormSchema,
  toSupplierForm,
  toSupplierPayload,
  type SupplierFormValues,
} from "../model";

import { BankSection } from "./bank-section";
import { IdentitySection } from "./identity-section";
import { TaxSection } from "./tax-section";

interface PropTypes {
  code?: string;
}

export const SupplierFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.SUPPLIER,
  );
  const listReturn = useListReturn(SUPPLIER_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveSupplier = useSaveSupplier(code);
  const deleteSupplier = useDeleteSupplier(code);
  const detail = useSupplierDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_SUPPLIER_FORM,
  });

  const status = useWatch({ control: form.control, name: "isActive" });
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteSupplier.isPending;
  const isHidden = isEdit && !detail.data;
  const isLocked = isBusy || isHidden;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const deleteError = deleteSupplier.error;
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
    deleteSupplier.reset();
    setRejectedField(null);

    try {
      const saved = await saveSupplier.mutateAsync(toSupplierPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(SUPPLIER_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteSupplier.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  const onDeactivate = () => {
    form.setValue("isActive", "false", { shouldDirty: true });
    revealField("isActive");
    // Fieldset tidak bisa difokus, dan tombol ini hilang sesudah diklik.
    document
      .querySelector<HTMLInputElement>('input[name="isActive"][value="false"]')
      ?.focus({ preventScroll: true });
  };

  const onRetryDetail = () => void detail.refetch();

  useEffect(() => {
    if (!detail.data) return;

    form.reset(toSupplierForm(detail.data), { keepDirtyValues: true });
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
    if (deleteSupplier.isError) deleteRef.current?.focus();
  }, [deleteSupplier.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah supplier"
            : "Tidak bisa menambah supplier"
        }
        description="Peran Anda hanya bisa melihat supplier."
        backHref={SUPPLIER_LIST_PATH}
        backLabel="Kembali ke Supplier"
      />
    );
  }

  if (isEdit && isNotFound) {
    return (
      <FormNotFound
        noun="supplier"
        backHref={listReturn}
        backLabel="Kembali ke Supplier"
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
              {deleteSupplier.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Supplier" : "Tambah Supplier"}
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
            title="Data supplier gagal dimuat."
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
        <LoadingForm fields={6} label="Memuat data supplier…" />
      ) : null}

      <div className={isHidden ? "hidden" : undefined}>
        <IdentitySection form={form} isDisabled={isBusy} />
        <TaxSection form={form} isDisabled={isBusy} />
        <BankSection form={form} isDisabled={isBusy} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteError ? (
          <div className="flex flex-col items-start gap-2">
            <FormAlert
              title="Supplier belum terhapus."
              message={deleteError.message}
            />
            {isInUse && status === "true" ? (
              <Button type="button" variant="outline" onClick={onDeactivate}>
                Nonaktifkan
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="supplier"
        descriptions={{ delete: "Apakah Anda ingin menghapus supplier ini?" }}
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
