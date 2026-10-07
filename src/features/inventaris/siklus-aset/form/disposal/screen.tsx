"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { formatAmount } from "@/lib/format";

import { useSubmitDisposal } from "../../api";
import {
  APPROVAL_SETTING_PATH,
  CYCLE_LIST_PATH,
  cycleListHref,
  disposalFormSchema,
  disposalHref,
  emptyDisposalForm,
  isWorkflowMissing,
  kindReturnHref,
  serverFieldError,
  toDisposalPayload,
  type DisposalFormValues,
} from "../../model";
import { NoCycleAccess } from "../../no-cycle-access";
import type { AssetOption } from "../../types";

import { DisposalSection } from "./disposal-section";
import { SUBMIT_DESCRIPTIONS } from "./form-options";

const LINK =
  "text-primary cursor-pointer font-medium underline-offset-4 hover:underline focus-visible:underline";

export const DisposalFormScreen = () => {
  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanDelete } = useMenuAccess(MENU.SIKLUS_ASET);
  const { isCanView: isCanViewSetting } = useMenuAccess(
    MENU.SETELAN_PERSETUJUAN,
  );
  const listReturn = kindReturnHref(
    useListReturn(CYCLE_LIST_PATH),
    "pelepasan",
  );
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [pickAsset, setPickAsset] = useState<AssetOption>();
  const submitDisposal = useSubmitDisposal();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<DisposalFormValues>({
    resolver: zodResolver(disposalFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyDisposalForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const summary = pickAsset
    ? `Diajukan untuk persetujuan dengan nilai ${formatAmount(pickAsset.acquisitionCost ?? 0)}`
    : undefined;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSubmitConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("delete");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSubmitConfirm, onInvalid)();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await submitDisposal.mutateAsync(toDisposalPayload(values));

      toast.add({ title: saved.message });
      router.replace(disposalHref(saved.data.code));
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

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

  if (!isCanView) return <NoCycleAccess />;

  if (!isCanDelete) {
    return (
      <NoFormAccess
        title="Tidak bisa mengajukan pelepasan barang"
        description="Peran Anda hanya bisa melihat siklus aset."
        backHref={cycleListHref("pelepasan")}
        backLabel="Kembali ke Siklus Aset"
      />
    );
  }

  return (
    <FormLayout
      onSubmit={onConfirm}
      actions={
        <FormActions status={summary}>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => confirm.onCancel(isDirty, onLeave)}
          >
            Batal
          </Button>

          <Button ref={saveRef} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mengajukan…" : "Ajukan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Ajukan Pelepasan"
          subtitle="Siklus Aset"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <DisposalSection
        form={form}
        isDisabled={isSubmitting}
        onPickAsset={setPickAsset}
      />

      {rootError ? (
        <div className="space-y-2 px-gutter pb-4">
          <FormAlert title="Pelepasan belum diajukan." message={rootError} />
          {isWorkflowMissing(rootError) ? (
            <p className="text-muted-foreground text-body">
              Minta administrator mengatur alur Pelepasan barang di{" "}
              {isCanViewSetting ? (
                <Link href={APPROVAL_SETTING_PATH} className={LINK}>
                  Setelan Alur Persetujuan
                </Link>
              ) : (
                "Setelan Alur Persetujuan"
              )}
              .
            </p>
          ) : null}
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="pelepasan"
        descriptions={SUBMIT_DESCRIPTIONS}
        onDelete={() => void onSubmit()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
