"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button, buttonVariants } from "@/components/common/control";
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
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useReceiptForReturn, useReturnDetail, useSaveReturn } from "../api";
import {
  RETURN_LIST_PATH,
  emptyReturnForm,
  isEditable,
  returnFormSchema,
  returnHref,
  toReturnForm,
  toReturnPayload,
  type ReturnFormValues,
} from "../model";

import { ItemSection } from "./item-section";
import { ReturnSection } from "./return-section";

const NOUN = "retur pembelian";

const BACK_LABEL = "Kembali ke Retur Pembelian";

interface PropTypes {
  publicId?: string;
}

export const ReturnFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.PURCHASE_RETURN,
  );
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(RETURN_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveReturn = useSaveReturn(publicId);
  const detail = useReturnDetail(isAllowed ? publicId : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyReturnForm(),
  });

  const receiptCode = useWatch({
    control: form.control,
    name: "goodsReceiptCode",
  });
  const receipt = useReceiptForReturn(receiptCode);
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const row = detail.data;
  const isWaiting = isEdit && !row;
  const backHref = publicId ? returnHref(publicId) : listReturn;
  const title = isEdit ? "Ubah Retur Pembelian" : "Tambah Retur Pembelian";
  const pinnedLabel = row?.supplier
    ? `${row.goodsReceipt?.code ?? ""} — ${row.supplier.name}`
    : (row?.goodsReceipt?.code ?? "");

  const onLeave = () => router.replace(backHref);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onPickReceipt = (code: string) => {
    form.setValue("goodsReceiptCode", code, { shouldDirty: true });
    form.setValue("items", [], { shouldDirty: true });
    form.clearErrors(["goodsReceiptCode", "items"]);
  };

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

    const found = receipt.data;

    if (!found) {
      form.setError("goodsReceiptCode", {
        message: "Rincian penerimaan belum termuat. Pilih ulang penerimaannya.",
      });
      setRejectedField("goodsReceiptCode");
      return;
    }

    try {
      const saved = await saveReturn.mutateAsync(
        toReturnPayload(values, found.id),
      );

      toast.add({ title: saved.message });
      saveListFocus(RETURN_LIST_PATH, saved.data.publicId);
      form.reset(values);
      router.replace(returnHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  // Jalan dua kali dan itu disengaja: sekali tanpa rincian penerimaan, sekali
  // lagi begitu rincian itu ada, hanya untuk melengkapi label satuannya.
  // `keepDirtyValues` menjaga isian yang sudah disentuh orang.
  useEffect(() => {
    if (!row || !isEditable(row)) return;

    form.reset(toReturnForm(row, receipt.data), { keepDirtyValues: true });
  }, [row, receipt.data, form]);

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
            ? "Tidak bisa mengubah retur pembelian"
            : "Tidak bisa menambah retur pembelian"
        }
        description="Peran Anda hanya bisa melihat retur pembelian."
        isCanView={isCanView}
        backHref={backHref}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound noun={NOUN} backHref={listReturn} backLabel={BACK_LABEL} />
    );
  }

  if (row && !isEditable(row)) {
    return (
      <div className="pb-8">
        <PageHeader
          title={title}
          subtitle={row.code}
          backHref={backHref}
          isBackPersistent
        />
        <EmptyState
          title="Retur tidak bisa diubah"
          description="Hanya retur berstatus Draf yang bisa diubah."
          action={
            <Link
              href={returnHref(row.publicId)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lihat retur
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
            disabled={isSubmitting || isWaiting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={title}
          subtitle={row?.code}
          backHref={backHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {isWaiting && !detail.error ? <LoadingForm fields={3} /> : null}

      {detail.error && !row ? (
        <div className="flex flex-col items-start gap-3 px-gutter py-5">
          <FormAlert
            title="Retur pembelian gagal dimuat."
            message={detail.error.message}
          />
          <Button
            type="button"
            variant="outline"
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
            isLoading={detail.isFetching}
          >
            {detail.isFetching ? "Memuat…" : "Coba lagi"}
          </Button>
        </div>
      ) : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <ReturnSection
          form={form}
          isDisabled={isSubmitting}
          pinnedCode={receiptCode}
          pinnedLabel={pinnedLabel}
          onPickReceipt={onPickReceipt}
        />
        <ItemSection
          form={form}
          receipt={receipt.data}
          isLoadingReceipt={receipt.isFetching}
          isDisabled={isSubmitting}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {receipt.error ? (
          <FormAlert
            title="Rincian penerimaan gagal dimuat."
            message={receipt.error.message}
          />
        ) : null}

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
