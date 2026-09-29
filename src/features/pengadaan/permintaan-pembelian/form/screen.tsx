"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { withFreshUrls } from "@/lib/attachment";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useRequestDetail, useSaveRequest } from "../api";
import {
  REQUEST_LIST_PATH,
  emptyRequestForm,
  requestFormSchema,
  requestHref,
  resubmitHref,
  serverFieldError,
  toCopiedForm,
  toFormError,
  toRequestForm,
  toRequestFormData,
  type RequestFormValues,
} from "../model";

import { ItemSection } from "./item-section";
import { QuoteSection } from "./quote-section";
import { RequestSection } from "./request-section";

const NOUN = "permintaan pembelian";

interface PropTypes {
  code?: string;
}

export const RequestFormScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const isEdit = Boolean(code);
  const copyCode = isEdit ? "" : (searchParams.get("salin") ?? "");
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PERMINTAAN_PEMBELIAN);
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(REQUEST_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveRequest = useSaveRequest(code);
  const detail = useRequestDetail(isAllowed ? code : undefined);
  const source = useRequestDetail(
    isAllowed && copyCode ? copyCode : undefined,
    false,
  );
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyRequestForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const copied = source.data?.status === "REJECTED" ? source.data : undefined;
  const isCopyWaiting = Boolean(copyCode) && source.isLoading;
  const isWaiting = (isEdit && !detail.data) || isCopyWaiting;
  const backHref = code ? requestHref(code) : listReturn;
  const title = isEdit
    ? "Ubah Permintaan Pembelian"
    : copied
      ? `Ajukan ulang ${copied.code}`
      : "Tambah Permintaan Pembelian";

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
      const saved = await saveRequest.mutateAsync(
        toRequestFormData(values, isEdit),
      );

      toast.add({ title: saved.message });
      saveListFocus(REQUEST_LIST_PATH, saved.data.code);
      form.reset(values);
      router.replace(requestHref(saved.data.code));
    } catch (error) {
      setRejectedField(
        applyServerError(toFormError(error), form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  useEffect(() => {
    if (detail.data?.status !== "DRAFT") return;

    form.reset(toRequestForm(detail.data), { keepDirtyValues: true });
    form.setValue(
      "attachments",
      withFreshUrls(form.getValues("attachments"), detail.data.attachments),
    );
  }, [detail.data, form]);

  useEffect(() => {
    if (copied) form.reset(toCopiedForm(copied), { keepDirtyValues: true });
  }, [copied, form]);

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
            ? "Tidak bisa mengubah permintaan pembelian"
            : "Tidak bisa menambah permintaan pembelian"
        }
        description="Peran Anda hanya bisa melihat permintaan pembelian."
        backHref={backHref}
        backLabel="Kembali ke Permintaan Pembelian"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Permintaan Pembelian"
      />
    );
  }

  if (code && detail.data && detail.data.status !== "DRAFT") {
    const isRejected = detail.data.status === "REJECTED";

    return (
      <div className="pb-8">
        <PageHeader
          title={title}
          subtitle={code}
          backHref={backHref}
          isBackPersistent
        />
        <EmptyState
          title="Permintaan tidak bisa diubah"
          description={
            isRejected
              ? "Hanya permintaan berstatus Draf yang bisa diubah. Gunakan Ajukan ulang."
              : "Hanya permintaan berstatus Draf yang bisa diubah."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href={requestHref(code)}
                className={buttonVariants({ variant: "outline" })}
              >
                Lihat permintaan
              </Link>
              {isRejected && isCanCreate ? (
                <Link href={resubmitHref(code)} className={buttonVariants()}>
                  Ajukan ulang
                </Link>
              ) : null}
            </div>
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
          subtitle={code}
          backHref={backHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading || isCopyWaiting ? <LoadingForm fields={4} /> : null}

      {detail.error && !detail.data ? (
        <div className="flex flex-col items-start gap-3 px-gutter py-5">
          <FormAlert
            title="Permintaan pembelian gagal dimuat."
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
        <RequestSection form={form} isDisabled={isSubmitting} />
        <ItemSection form={form} isDisabled={isSubmitting} />
        <QuoteSection
          form={form}
          isDisabled={isSubmitting}
          copiedFrom={copied?.code}
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
