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
  NoFormAccess,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useCreateTransfer } from "../../api";
import {
  CYCLE_LIST_PATH,
  cycleListHref,
  emptyTransferForm,
  kindReturnHref,
  serverFieldError,
  toTransferPayload,
  transferFormSchema,
  type TransferFormValues,
} from "../../model";
import { NoCycleAccess } from "../../no-cycle-access";
import type { AssetOption } from "../../types";

import { SAVE_DESCRIPTIONS } from "./form-options";
import { TransferSection } from "./transfer-section";

export const TransferFormScreen = () => {
  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanCreate } = useMenuAccess(MENU.SIKLUS_ASET);
  const listReturn = kindReturnHref(useListReturn(CYCLE_LIST_PATH), "pindah");
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [pickAsset, setPickAsset] = useState<AssetOption>();
  const createTransfer = useCreateTransfer();
  const confirm = useFormConfirm();
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
      const saved = await createTransfer.mutateAsync(toTransferPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(CYCLE_LIST_PATH, saved.data.code);
      router.replace(listReturn);
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

  if (!isCanCreate) {
    return (
      <NoFormAccess
        title="Tidak bisa memindahkan barang"
        description="Peran Anda hanya bisa melihat siklus aset."
        backHref={cycleListHref("pindah")}
        backLabel="Kembali ke Siklus Aset"
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
          title="Pindahkan Barang"
          subtitle="Siklus Aset"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <TransferSection
        form={form}
        isDisabled={isSubmitting}
        asset={pickAsset}
        onPickAsset={setPickAsset}
      />

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
        noun="pindah lokasi"
        descriptions={SAVE_DESCRIPTIONS}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
