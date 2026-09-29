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

import { useCurrencyDetail, useSaveCurrency } from "../api";
import {
  EMPTY_CURRENCY_FORM,
  MATA_UANG_LIST_PATH,
  NO_VIEW,
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
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(MENU.MATA_UANG);
  const listReturn = useListReturn(MATA_UANG_LIST_PATH);
  const leaveHref = code ? currencyDetailHref(code) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveCurrency = useSaveCurrency(code);
  const detail = useCurrencyDetail(isCanUpdate ? code : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_CURRENCY_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;

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

  useEffect(() => {
    if (detail.data) form.reset(toCurrencyForm(detail.data));
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
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            Batal
          </Button>

          <Button
            ref={saveRef}
            type="submit"
            disabled={isSubmitting || detail.isLoading}
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
        <CurrencySection
          form={form}
          isDisabled={isSubmitting}
          isEdit={isEdit}
        />
      </div>

      {rootError ? (
        <div className="px-gutter pb-4">
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="mata uang"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
