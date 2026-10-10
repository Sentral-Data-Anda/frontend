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

import { useCurrencyDetail, useDeleteCurrency, useSaveCurrency } from "../api";
import {
  EMPTY_CURRENCY_FORM,
  MATA_UANG_LIST_PATH,
  NO_VIEW,
  currencyDeleteText,
  currencyDetailHref,
  currencyFormSchema,
  currencyServerError,
  toCurrencyForm,
  toCurrencyPayload,
  type CurrencyFormValues,
} from "../model";

import { CurrencySection } from "./currency-section";

interface PropTypes {
  code?: string;
}

export const CurrencyFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.CURRENCY,
  );
  const listReturn = useListReturn(MATA_UANG_LIST_PATH);
  const leaveHref = code ? currencyDetailHref(code) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveCurrency = useSaveCurrency(code);
  const deleteCurrency = useDeleteCurrency(code);
  const detail = useCurrencyDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_CURRENCY_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isBusy = isSubmitting || deleteCurrency.isPending;
  const isDeletable = isEdit && isCanDelete && detail.data?.isBase === false;

  const onLeave = () => router.replace(leaveHref);

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
    deleteCurrency.reset();
    setRejectedField(null);

    try {
      const saved = await saveCurrency.mutateAsync(toCurrencyPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(MATA_UANG_LIST_PATH, saved.data.code);
      router.replace(currencyDetailHref(saved.data.code));
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, currencyServerError),
      );
    }
  }, onInvalid);

  const onDelete = () => {
    form.clearErrors("root");
    deleteCurrency.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        router.replace(listReturn);
      },
    });
  };

  useEffect(() => {
    if (detail.data) {
      form.reset(toCurrencyForm(detail.data), { keepDirtyValues: true });
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
    if (deleteCurrency.isError) deleteRef.current?.focus();
  }, [deleteCurrency.isError]);

  if (!(isEdit ? isCanUpdate : isCanCreate)) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah mata uang"
            : "Tidak bisa menambah mata uang"
        }
        description={
          isCanView ? "Peran Anda hanya bisa melihat data mata uang." : NO_VIEW
        }
        backHref={leaveHref}
        backLabel="Kembali ke Mata Uang"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="mata uang"
        backHref={listReturn}
        backLabel="Kembali ke Mata Uang"
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
              isLoading={deleteCurrency.isPending}
            >
              {deleteCurrency.isPending ? "Menghapus…" : "Hapus"}
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
          title={isEdit ? "Ubah Mata Uang" : "Tambah Mata Uang"}
          subtitle={
            detail.data ? `${detail.data.code} — ${detail.data.name}` : code
          }
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={3} label="Memuat data mata uang…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <CurrencySection form={form} isDisabled={isBusy} isEdit={isEdit} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {deleteCurrency.error ? (
          <FormAlert
            title="Mata uang belum terhapus."
            message={deleteCurrency.error.message}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="mata uang"
        descriptions={
          detail.data ? { delete: currencyDeleteText(detail.data) } : undefined
        }
        onSave={() => void onSave()}
        onLeave={onLeave}
        onDelete={onDelete}
      />
    </FormLayout>
  );
};
