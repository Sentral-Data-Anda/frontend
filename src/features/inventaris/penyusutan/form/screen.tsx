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
  LoadingForm,
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useLatestRun, useOpenRun } from "../api";
import {
  PENYUSUTAN_LIST_PATH,
  defaultPeriod,
  runFormSchema,
  toRunPayload,
  type RunFormValues,
} from "../model";

import { PeriodSection } from "./period-section";

const isPeriodError = (error: unknown) =>
  error instanceof FetchError && (error.status === 400 || error.status === 409);

export const PenyusutanFormScreen = () => {
  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanCreate } = useMenuAccess(MENU.DEPRECIATION);
  const listReturn = useListReturn(PENYUSUTAN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const openRun = useOpenRun();
  const latest = useLatestRun(isCanCreate);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RunFormValues>({
    resolver: zodResolver(runFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { period: "" },
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const initialPeriod = latest.isPending
    ? null
    : defaultPeriod(latest.data ?? undefined);

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors();
    setRejectedField(null);

    try {
      const saved = await openRun.mutateAsync(toRunPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(PENYUSUTAN_LIST_PATH, saved.data.code);
      router.replace(listReturn);
    } catch (error) {
      const field = isPeriodError(error) ? "period" : "root";

      form.setError(field, {
        message:
          error instanceof FetchError
            ? error.message
            : "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
      setRejectedField(field);
    }
  }, onInvalid);

  useEffect(() => {
    if (initialPeriod) form.reset({ period: initialPeriod });
  }, [initialPeriod, form]);

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

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa membuka periode penyusutan"
        description="Peran Anda hanya bisa melihat penyusutan."
        isCanView={isCanView}
        backHref={PENYUSUTAN_LIST_PATH}
        backLabel="Kembali ke Penyusutan"
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
            disabled={isSubmitting || latest.isPending}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Buka Periode Penyusutan"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {latest.isPending ? (
        <LoadingForm fields={1} label="Memuat periode penyusutan…" />
      ) : (
        <PeriodSection form={form} isDisabled={isSubmitting} />
      )}

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
        noun="periode penyusutan"
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
