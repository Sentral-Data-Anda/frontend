"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  Button,
  buttonVariants,
  type SelectOption,
} from "@/components/common/control";
import { EmptyState, useToast } from "@/components/common/feedback";
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
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import {
  fetchRequestDetail,
  useCurrencyOptions,
  useOrderDetail,
  useRatePreview,
  useRequestDetail,
  useRequestOptions,
  useSaveOrder,
} from "../api";
import {
  ORDER_LIST_PATH,
  copyLinesOf,
  currencyLabelOf,
  emptyOrderForm,
  isEditable,
  isForeign,
  orderFormSchema,
  orderHref,
  requestHintOf,
  requestLabelOf,
  supplierHintOf,
  toOrderForm,
  toOrderPayload,
  type OrderFormValues,
} from "../model";
import type { SupplierOption } from "../types";

import type { RateState, RequestEstimate } from "./form-options";
import { ItemSection } from "./item-section";
import { OrderSection } from "./order-section";

const NOUN = "pesanan pembelian";

const copyFailureOf = (error: unknown) =>
  error instanceof FetchError
    ? `Barang permintaan gagal dimuat. ${error.message}`
    : "Tidak dapat menghubungi server. Periksa koneksi Anda.";

const withPinned = (
  options: readonly SelectOption[],
  pinned: SelectOption | null,
) =>
  pinned && !options.some((option) => option.value === pinned.value)
    ? [pinned, ...options]
    : options;

interface PropTypes {
  code?: string;
}

export const OrderFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEdit = Boolean(code);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.PURCHASE_ORDER,
  );
  const requestAccess = useMenuAccess(MENU.PURCHASE_REQUEST);
  const currencyAccess = useMenuAccess(MENU.CURRENCY);
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(ORDER_LIST_PATH);
  const leaveHref = code ? orderHref(code) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const isCopying = useBoolean();
  const prefillRef = useRef(false);
  const saveOrder = useSaveOrder(code);
  const detail = useOrderDetail(isAllowed ? code : undefined);
  const requests = useRequestOptions();
  const currencies = useCurrencyOptions();
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyOrderForm(),
  });

  const [purchaseRequestId, supplierId, currencyCode, orderDate] = useWatch({
    control: form.control,
    name: ["purchaseRequestId", "supplierId", "currencyCode", "orderDate"],
  });
  const suppliers = useDdlOptions<SupplierOption>(
    "supplier",
    "id",
    supplierId,
    supplierHintOf,
  );
  const ratePreview = useRatePreview(currencyCode, orderDate);
  const order = detail.data;
  const requestRows = requests.data ?? [];
  const linkedCode = isEdit
    ? ""
    : (searchParams.get("permintaan") ?? "").toLowerCase();
  const linked = linkedCode
    ? requestRows.find((row) => row.code.toLowerCase() === linkedCode)
    : undefined;
  const linkedDetail = useRequestDetail(
    linked && requestAccess.isCanView ? linked.code : undefined,
  );
  const isLinkedPending =
    Boolean(linked) && requestAccess.isCanView && linkedDetail.isPending;
  const request = requestRows.find(
    (row) => String(row.id) === purchaseRequestId,
  );
  const isOwnRequest =
    order !== undefined &&
    String(order.purchaseRequestId) === purchaseRequestId;
  const estimate: RequestEstimate | null = isOwnRequest
    ? {
        requestCode: order.purchaseRequest.code,
        totalEstimatedIDR: order.purchaseRequest.totalEstimatedIDR,
        orderedTotalIDR: order.purchaseRequest.orderedTotalIDR,
      }
    : request
      ? {
          requestCode: request.code,
          totalEstimatedIDR: request.totalEstimatedIDR,
          orderedTotalIDR: request.orderedTotalIDR,
        }
      : null;
  const requestOptions = withPinned(
    requestRows.map((row) => ({
      value: String(row.id),
      label: requestLabelOf(row),
      hint: requestHintOf(row),
    })),
    order
      ? {
          value: String(order.purchaseRequestId),
          label: `${order.purchaseRequest.purpose} · ${order.purchaseRequest.code}`,
        }
      : null,
  );
  const supplierOptions = withPinned(
    suppliers.options,
    order
      ? { value: String(order.supplierId), label: order.supplier.name }
      : null,
  );
  const currencyOptions = (currencies.data ?? []).map((row) => ({
    value: row.code,
    label: currencyLabelOf(row),
  }));
  const supplierRow = suppliers.rows.find(
    (row) => String(row.id) === supplierId,
  );
  const rate: RateState = isForeign(currencyCode)
    ? {
        rate: ratePreview.rate ? Number(ratePreview.rate.rate) : null,
        rateDate: ratePreview.rate?.rateDate ?? null,
      }
    : { rate: 1, rateDate: null };
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isWaiting = isEdit && !order;
  const purpose =
    request?.purpose ?? (isOwnRequest ? order.purchaseRequest.purpose : "");
  const requestCode = estimate?.requestCode ?? "";

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

  const onCopy = async () => {
    setCopyMessage(null);
    isCopying.onTrue();
    try {
      const found = await fetchRequestDetail(queryClient, requestCode);

      form.setValue(
        "items",
        copyLinesOf(found, form.getValues("currencyCode")),
        {
          shouldDirty: true,
        },
      );
      form.clearErrors("items");
    } catch (error) {
      setCopyMessage(copyFailureOf(error));
    } finally {
      isCopying.onFalse();
    }
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await saveOrder.mutateAsync(toOrderPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(ORDER_LIST_PATH, saved.data.code);
      router.replace(orderHref(saved.data.code));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (detail.data && isEditable(detail.data)) {
      form.reset(toOrderForm(detail.data));
    }
  }, [detail.data, form]);

  useEffect(() => {
    if (!linked || isLinkedPending || prefillRef.current) return;

    prefillRef.current = true;
    form.reset({
      ...emptyOrderForm(),
      purchaseRequestId: String(linked.id),
      items: linkedDetail.data
        ? copyLinesOf(linkedDetail.data, emptyOrderForm().currencyCode)
        : [],
    });
  }, [linked, isLinkedPending, linkedDetail.data, form]);

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
        title={
          isEdit
            ? "Tidak bisa mengubah pesanan pembelian"
            : "Tidak bisa menambah pesanan pembelian"
        }
        description="Peran Anda hanya bisa melihat pesanan pembelian."
        isCanView={isCanView}
        backHref={leaveHref}
        backLabel="Kembali ke Pesanan Pembelian"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Pesanan Pembelian"
      />
    );
  }

  if (code && order && !isEditable(order)) {
    return (
      <div className="pb-8">
        <PageHeader
          title="Ubah Pesanan Pembelian"
          subtitle={code}
          backHref={orderHref(code)}
          isBackPersistent
        />
        <EmptyState
          title="Pesanan tidak bisa diubah"
          description="Hanya pesanan berstatus Dipesan yang belum ada penerimaan barang yang bisa diubah."
          action={
            <Link
              href={orderHref(code)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lihat pesanan
            </Link>
          }
        />
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
            disabled={
              isSubmitting || isWaiting || isCopying.value || isLinkedPending
            }
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={isEdit ? "Ubah Pesanan Pembelian" : "Tambah Pesanan Pembelian"}
          subtitle={code}
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={6} /> : null}

      {detail.error && !order ? (
        <div className="flex flex-col items-start gap-3 px-gutter py-5">
          <FormAlert
            title="Pesanan pembelian gagal dimuat."
            message={detail.error.message}
          />
          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <OrderSection
          form={form}
          requestOptions={requestOptions}
          requestHint={request ? requestHintOf(request) : undefined}
          isRequestLoading={requests.isFetching}
          supplierOptions={supplierOptions}
          supplierHint={supplierRow?.phone}
          isSupplierLoading={suppliers.isLoading}
          currencyOptions={currencyOptions}
          ratePreview={ratePreview}
          isCanFillRate={currencyAccess.isCanCreate}
          isDisabled={isSubmitting}
        />
        <ItemSection
          form={form}
          estimate={estimate}
          purpose={purpose}
          rate={rate}
          isCopyAllowed={requestAccess.isCanView && Boolean(requestCode)}
          isCopying={isCopying.value}
          copyMessage={
            copyMessage ??
            (linkedDetail.error ? copyFailureOf(linkedDetail.error) : null)
          }
          onCopy={() => void onCopy()}
          isDisabled={isSubmitting}
        />
      </div>

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
        noun={NOUN}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
