"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/common/control";
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
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useCurrencyDetail, useRateDetail, useSaveRate } from "../api";
import {
  MATA_UANG_LIST_PATH,
  currencyDetailHref,
  emptyRateForm,
  rateFormSchema,
  rateServerError,
  toRateForm,
  toRatePayload,
  type RateFormValues,
} from "../model";

import { RateSection } from "./rate-section";

interface PropTypes {
  code: string;
  id?: string;
}

export const RateFormScreen = (props: PropTypes) => {
  const { code, id } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(id);
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.MATA_UANG);
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const currencyCode = code.toUpperCase();
  const backHref = currencyDetailHref(currencyCode);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const currency = useCurrencyDetail(isAllowed ? code : undefined);
  const detail = useRateDetail(isAllowed ? id : undefined);
  const saveRate = useSaveRate(id);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);
  const rate = detail.data;
  const isForeignRate =
    rate !== undefined && rate.currencyCode.toUpperCase() !== currencyCode;
  const isNotFound =
    isForeignRate ||
    [currency.error, detail.error].some(
      (error) => error instanceof FetchError && error.status === 404,
    );
  const isLoading = currency.isLoading || detail.isLoading;

  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyRateForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError =
    form.formState.errors.root?.message ??
    currency.error?.message ??
    detail.error?.message;

  const onLeave = () => router.replace(backHref);

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
      const saved = await saveRate.mutateAsync(
        toRatePayload(values, currencyCode),
      );

      toast.add({ title: saved.message });
      saveListFocus(backHref, String(saved.data.id));
      router.replace(backHref);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError, rateServerError));
    }
  }, onInvalid);

  useEffect(() => {
    if (rate) form.reset(toRateForm(rate));
  }, [rate, form]);

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

  if (!isAllowed) {
    return (
      <NoFormAccess
        title={isEdit ? "Tidak bisa mengubah kurs" : "Tidak bisa menambah kurs"}
        description="Peran Anda hanya bisa melihat kurs."
        backHref={backHref}
        backLabel={`Kembali ke ${currencyCode}`}
      />
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun={isEdit ? "kurs" : "mata uang"}
        backHref={isEdit ? backHref : MATA_UANG_LIST_PATH}
        backLabel={
          isEdit ? `Kembali ke ${currencyCode}` : "Kembali ke Mata Uang"
        }
      />
    );
  }

  if (currency.data?.isBase) {
    return (
      <div className="mx-auto w-full max-w-lg">
        <PageHeader
          title="Rupiah tidak punya kurs"
          backHref={backHref}
          isBackPersistent
        />
        <div className="flex flex-col items-start gap-3 px-gutter">
          <p className="text-muted-foreground text-body">
            Rupiah adalah mata uang dasar. 1 Rupiah = 1 Rupiah, jadi kurs hanya
            diisi untuk mata uang asing.
          </p>
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline" })}
          >
            Kembali ke Rupiah
          </Link>
        </div>
      </div>
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
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Kurs" : "Tambah Kurs"}
          subtitle={
            currency.data
              ? `${currency.data.code} — ${currency.data.name}`
              : currencyCode
          }
          backHref={backHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {isLoading ? <LoadingForm fields={2} label="Memuat data kurs…" /> : null}

      <div className={isLoading ? "hidden" : undefined}>
        <RateSection
          form={form}
          currencyCode={currencyCode}
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
        noun="kurs"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
