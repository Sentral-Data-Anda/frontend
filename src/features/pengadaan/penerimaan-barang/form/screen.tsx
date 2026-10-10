"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";

import { fetchOrderForReceipt, useOpenOrders, useSaveReceipt } from "../api";
import {
  RECEIPT_LIST_PATH,
  confirmTextOf,
  emptyReceiptForm,
  isLineTouched,
  isStaleOrderError,
  linesOf,
  orderDateOf,
  orderOptionOf,
  receiptFormSchema,
  receiptHref,
  toFormIssues,
  toReceiptFormData,
  type ReceiptFormValues,
} from "../model";

import { ItemSection } from "./item-section";
import { ProofSection } from "./proof-section";
import { ReceiptSection } from "./receipt-section";

const OFFLINE = "Tidak dapat menghubungi server. Periksa koneksi Anda.";

const ORDER_CHANGE_TEXT =
  "Apakah Anda ingin mengganti pesanan? Baris yang sudah diisi akan diganti.";

export const ReceiptFormScreen = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isCanView, isCanCreate } = useMenuAccess(MENU.GOODS_RECEIPT);
  const listReturn = useListReturn(RECEIPT_LIST_PATH);
  const saveReceipt = useSaveReceipt();
  const orders = useOpenOrders(isCanCreate);
  const confirm = useFormConfirm();
  const orderConfirm = useFormConfirm();
  const isLoading = useBoolean();
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [pickOrderId, setPickOrderId] = useState("");
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const prefillRef = useRef(searchParams.get("pesanan") ?? "");
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyReceiptForm(),
  });

  const rows = useFieldArray({ control: form.control, name: "items" });
  const orderOptions = orders.rows.map(orderOptionOf);
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;

  const onLeave = () => router.replace(listReturn);

  const onLoadOrder = async (id: string, isPrefill = false) => {
    const order = orders.rows.find((row) => String(row.id) === id);

    form.setValue("purchaseOrderId", id, { shouldDirty: !isPrefill });
    form.setValue("orderDate", "");
    form.clearErrors(["purchaseOrderId", "receivedDate", "items"]);
    rows.replace([]);
    setLoadMessage(null);
    if (!order) return;

    isLoading.onTrue();
    try {
      const found = await fetchOrderForReceipt(queryClient, order.code);

      if (form.getValues("purchaseOrderId") !== id) return;

      form.setValue("orderDate", orderDateOf(found));
      rows.replace(linesOf(found));
      if (isPrefill) form.reset(form.getValues());
    } catch (error) {
      setLoadMessage(error instanceof FetchError ? error.message : OFFLINE);
    } finally {
      isLoading.onFalse();
    }
  };

  const onPickOrder = (id: string) => {
    if (id === form.getValues("purchaseOrderId")) return;

    if (form.getValues("items").some(isLineTouched)) {
      setPickOrderId(id);
      orderConfirm.onOpen("cancel");
      return;
    }

    void onLoadOrder(id);
  };

  const onRefreshOrder = async () => {
    const id = form.getValues("purchaseOrderId");
    const order = orders.rows.find((row) => String(row.id) === id);

    void orders.onRefetch();
    if (!order) return;

    const found = await fetchOrderForReceipt(queryClient, order.code).catch(
      () => null,
    );

    form.getValues("items").forEach((line, index) => {
      const fresh = found?.items.find(
        (item) => String(item.id) === line.purchaseOrderItemId,
      );

      if (!fresh) return;

      form.setValue(`items.${index}.received`, fresh.receivedQuantity);
      form.setValue(`items.${index}.remaining`, fresh.remainingQuantity);
    });
  };

  const onRetryLoad = () => void onLoadOrder(form.getValues("purchaseOrderId"));

  const onClear = (index: number) =>
    form.setValue(`items.${index}.quantityReceived`, "", {
      shouldDirty: true,
      shouldValidate: submitCount > 0,
    });

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
      const saved = await saveReceipt.mutateAsync(toReceiptFormData(values));

      toast.add({ title: saved.message });
      router.replace(receiptHref(saved.data.code));
    } catch (error) {
      setRejectedField(
        applyServerError(toFormIssues(error, values), form.setError),
      );
      if (isStaleOrderError(error)) void onRefreshOrder();
    }
  }, onInvalid);

  useEffect(() => {
    const code = prefillRef.current.toLowerCase();
    const found = orders.rows.find((row) => row.code.toLowerCase() === code);

    if (!code || !found) return;

    prefillRef.current = "";
    void onLoadOrder(String(found.id), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali, saat pilihan pesanan tiba
  }, [orders.rows]);

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
        title="Tidak bisa mencatat penerimaan barang"
        description={
          isCanView
            ? "Peran Anda hanya bisa melihat penerimaan barang."
            : "Peran Anda tidak memegang akses Penerimaan Barang."
        }
        backHref={listReturn}
        backLabel="Kembali ke Penerimaan Barang"
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
            disabled={isSubmitting || isLoading.value}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Catat Penerimaan Barang"
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      <ReceiptSection
        form={form}
        orderOptions={orderOptions}
        isOrdersLoading={orders.isLoading}
        isDisabled={isSubmitting}
        onPickOrder={onPickOrder}
      />
      <ItemSection
        form={form}
        fields={rows.fields}
        isLoading={isLoading.value}
        loadMessage={loadMessage}
        isDisabled={isSubmitting}
        onRetry={loadMessage ? onRetryLoad : undefined}
        onClear={onClear}
      />
      <ProofSection form={form} isDisabled={isSubmitting} />

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Data belum tersimpan. Coba simpan lagi."
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="penerimaan barang"
        descriptions={{ save: confirmTextOf(form.getValues("items")) }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />

      <FormConfirmDialog
        confirm={orderConfirm}
        noun="penerimaan barang"
        descriptions={{ cancel: ORDER_CHANGE_TEXT }}
        onLeave={() => void onLoadOrder(pickOrderId)}
      />
    </FormLayout>
  );
};
