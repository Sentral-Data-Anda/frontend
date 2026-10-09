"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

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

import { useInvoiceDetail, useSaveInvoice } from "../api";
import {
  INVOICE_LIST_PATH,
  NO_VIEW,
  emptyInvoiceForm,
  invoiceFormSchema,
  invoiceHref,
  isEditable,
  serverFieldError,
  toInvoiceForm,
  toInvoicePayload,
  type InvoiceFormValues,
} from "../model";

import { InvoiceSection } from "./invoice-section";

const NOUN = "faktur supplier";

const BACK_LABEL = "Kembali ke Faktur Supplier";

interface PropTypes {
  publicId?: string;
}

export const InvoiceFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.SUPPLIER_INVOICE,
  );
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(INVOICE_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveInvoice = useSaveInvoice(publicId);
  const detail = useInvoiceDetail(isAllowed ? publicId : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyInvoiceForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const invoice = detail.data;
  const isWaiting = isEdit && !invoice;
  const backHref = publicId ? invoiceHref(publicId) : listReturn;
  const title = isEdit ? "Ubah Faktur Supplier" : "Tambah Faktur Supplier";
  const isOpenForEdit = invoice ? isEditable(invoice) : true;

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
      const saved = await saveInvoice.mutateAsync(toInvoicePayload(values));

      toast.add({ title: saved.message });
      saveListFocus(INVOICE_LIST_PATH, saved.data.publicId);
      form.reset(values);
      router.replace(invoiceHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(
        applyServerError(error, form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  useEffect(() => {
    if (!invoice || !isEditable(invoice)) return;

    form.reset(toInvoiceForm(invoice), { keepDirtyValues: true });
  }, [invoice, form]);

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

  if (!isAllowed) {
    return (
      <NoFormAccess
        title={
          isEdit
            ? "Tidak bisa mengubah faktur supplier"
            : "Tidak bisa menambah faktur supplier"
        }
        description={
          isCanView ? "Peran Anda hanya bisa melihat faktur." : NO_VIEW
        }
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

  if (publicId && invoice && !isOpenForEdit) {
    return (
      <div className="pb-8">
        <PageHeader
          title={title}
          subtitle={invoice.code}
          backHref={backHref}
          isBackPersistent
        />
        <EmptyState
          title="Faktur ini tidak bisa diubah"
          description="Hanya faktur berstatus Draf yang bisa diubah. Faktur yang sudah diterbitkan menunggu pembayaran."
          action={
            <Link
              href={invoiceHref(publicId)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lihat faktur
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
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={title}
          subtitle={invoice?.code}
          backHref={backHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={6} /> : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <InvoiceSection form={form} isDisabled={isSubmitting} />
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
