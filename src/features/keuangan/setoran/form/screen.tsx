"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/common/control";
import { useToast } from "@/components/common/feedback";
import {
  FormActions,
  FormAlert,
  FormConfirmDialog,
  FormLayout,
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";

import { useAssetAccounts, useSaveTransfer } from "../api";
import {
  ACCOUNT_CREATE_PATH,
  ACCOUNT_LIST_PATH,
  EMPTY_ACCOUNT_DESCRIPTION,
  EMPTY_ACCOUNT_TITLE,
  NO_VIEW,
  PREFILL_PARAM,
  TRANSFER_INFO,
  TRANSFER_LIST_PATH,
  emptyTransferForm,
  fixLinkOf,
  pickAccountId,
  saveTextOf,
  toTransferPayload,
  transferFormSchema,
  transferHref,
  type TransferFormValues,
} from "../model";

import { TransferSection } from "./transfer-section";

export const TransferFormScreen = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { isCanView, isCanCreate } = useMenuAccess(MENU.BANK_DEPOSIT);
  const accountAccess = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const listReturn = useListReturn(TRANSFER_LIST_PATH);
  const accounts = useAssetAccounts();
  const saveTransfer = useSaveTransfer();
  const confirm = useFormConfirm();
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const prefillRef = useRef({
    fromAccountId: searchParams.get(PREFILL_PARAM.from) ?? "",
    toAccountId: searchParams.get(PREFILL_PARAM.to) ?? "",
  });
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyTransferForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const fixLink = fixLinkOf(saveTransfer.error);
  const isAccountEmpty = !accounts.isLoading && accounts.rows.length === 0;

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
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await saveTransfer.mutateAsync(toTransferPayload(values));

      toast.add({ title: saved.message });
      router.replace(transferHref(saved.data.code));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    const prefill = prefillRef.current;

    if (accounts.rows.length === 0) return;

    prefillRef.current = { fromAccountId: "", toAccountId: "" };
    for (const [name, term] of Object.entries(prefill)) {
      const id = term ? pickAccountId(accounts.rows, term) : "";

      if (id) form.setValue(name as keyof TransferFormValues, id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali, saat pilihan akun tiba
  }, [accounts.rows]);

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

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa mencatat setoran"
        description={
          isCanView ? "Peran Anda hanya bisa melihat setoran." : NO_VIEW
        }
        backHref={listReturn}
        backLabel="Kembali ke Setoran"
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

          <Button ref={saveRef} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Catat Setoran"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <div className="space-y-3 px-gutter pt-4">
        <FormAlert
          tone="info"
          title="Uang hanya berpindah tempat"
          message={TRANSFER_INFO}
        />

        {isAccountEmpty ? (
          <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-control border px-4 py-3">
            <p className="min-w-0 flex-[1_1_18rem] text-body">
              <span className="font-medium">{EMPTY_ACCOUNT_TITLE}.</span>{" "}
              {EMPTY_ACCOUNT_DESCRIPTION}
            </p>
            {accountAccess.isCanView ? (
              <Link
                href={
                  accountAccess.isCanCreate
                    ? ACCOUNT_CREATE_PATH
                    : ACCOUNT_LIST_PATH
                }
                className={buttonVariants({ variant: "outline" })}
              >
                {accountAccess.isCanCreate ? "Buat akun" : "Buka Akun"}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <TransferSection form={form} isDisabled={isSubmitting} />

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Setoran belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}

        {rootError && fixLink ? (
          <Link
            href={fixLink.href}
            className={buttonVariants({ variant: "outline" })}
          >
            {fixLink.label}
          </Link>
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="setoran"
        descriptions={{ save: saveTextOf(accounts.rows, form.getValues()) }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
