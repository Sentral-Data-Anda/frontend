"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

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

import { useCreateMutasi, usePresetStock } from "../api";
import {
  MUTASI_LIST_PATH,
  emptyMovementForm,
  movementFormSchema,
  serverFieldError,
  stockHintOf,
  stockShortageOf,
  toMovementPayload,
  type MovementFormValues,
} from "../model";
import type { StockOption } from "../types";

import { ItemSection } from "./item-section";
import { MovementSection } from "./movement-section";

const SAVE_DESCRIPTION =
  "Apakah Anda ingin menyimpan mutasi ini? Mutasi tidak bisa diubah atau dihapus.";

export const MutasiFormScreen = () => {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const presetCode = searchParams.get("barang") ?? "";
  const { isCanView, isCanCreate } = useMenuAccess(MENU.STOCK_MOVEMENT);
  const listReturn = useListReturn(MUTASI_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const createMutasi = useCreateMutasi();
  const preset = usePresetStock(isCanCreate ? presetCode : "");
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyMovementForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const stockItemId = useWatch({ control: form.control, name: "stockItemId" });
  const [pickedRow, setPickedRow] = useState<StockOption | null>(null);
  const presetRow = preset.data;
  const stock =
    [pickedRow, presetRow].find(
      (row) => row && String(row.id) === stockItemId,
    ) ?? undefined;
  const pinned = presetRow
    ? {
        value: String(presetRow.id),
        label: presetRow.name,
        hint: stockHintOf(presetRow),
      }
    : null;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = (values: MovementFormValues) => {
    const shortage = stockShortageOf(values, stock);

    if (shortage) {
      form.setError("quantity", { message: shortage });
      setRejectedField("quantity");
      return;
    }

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
      const saved = await createMutasi.mutateAsync(toMovementPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(MUTASI_LIST_PATH, saved.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  useEffect(() => {
    if (!presetRow || form.formState.isDirty || form.getValues("stockItemId")) {
      return;
    }

    form.reset({ ...form.getValues(), stockItemId: String(presetRow.id) });
  }, [presetRow, form]);

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
        title="Tidak bisa mencatat mutasi stok"
        description="Peran Anda hanya bisa melihat mutasi stok."
        isCanView={isCanView}
        backHref={MUTASI_LIST_PATH}
        backLabel="Kembali ke Mutasi Stok"
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
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Catat Mutasi"
          subtitle="Stock Movement"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <ItemSection
        form={form}
        isDisabled={isSubmitting}
        pinned={pinned}
        picked={stock}
        onPickStock={setPickedRow}
      />
      <MovementSection form={form} isDisabled={isSubmitting} stock={stock} />

      {rootError ? (
        <div className="px-gutter pb-4">
          <FormAlert
            title="Mutasi belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        </div>
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun="mutasi stok"
        descriptions={{ save: SAVE_DESCRIPTION }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
