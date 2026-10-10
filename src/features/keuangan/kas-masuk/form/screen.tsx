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
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useGatewayAccount, useReceiptDetail, useSaveReceipt } from "../api";
import {
  GATEWAY_NOTE,
  GATEWAY_PARAM,
  KAS_MASUK_LIST_PATH,
  NOUN,
  SETTING_LINK,
  emptyReceiptForm,
  gatewayReceiptForm,
  isEditable,
  receiptFormSchema,
  receiptHref,
  toReceiptForm,
  toReceiptPayload,
  type ReceiptFormValues,
} from "../model";
import { FixLink } from "../ui";

import { LineSection } from "./line-section";
import { ReceiptSection } from "./receipt-section";

interface PropTypes {
  publicId?: string;
}

export const ReceiptFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(MENU.KAS_MASUK);
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const isGateway = !isEdit && searchParams.get(GATEWAY_PARAM) === "1";
  const listReturn = useListReturn(KAS_MASUK_LIST_PATH);
  const leaveHref = publicId ? receiptHref(publicId) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const prefillRef = useRef(false);
  const saveRef = useRef<HTMLButtonElement>(null);
  const saveReceipt = useSaveReceipt(publicId);
  const detail = useReceiptDetail(isAllowed ? publicId : undefined);
  const gateway = useGatewayAccount(isGateway);
  const confirm = useFormConfirm();

  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyReceiptForm(),
  });

  const receipt = detail.data;
  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const isWaiting = (isEdit && !receipt) || gateway.isPending;

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

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await saveReceipt.mutateAsync(toReceiptPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(KAS_MASUK_LIST_PATH, saved.data.publicId);
      router.replace(receiptHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (receipt && isEditable(receipt.status))
      form.reset(toReceiptForm(receipt));
  }, [receipt, form]);

  useEffect(() => {
    if (!isGateway || gateway.isPending || prefillRef.current) return;

    prefillRef.current = true;
    form.reset(gatewayReceiptForm(gateway.account?.id ?? null));
  }, [isGateway, gateway.isPending, gateway.account, form]);

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
            ? "Tidak bisa mengubah kas masuk"
            : "Tidak bisa menambah kas masuk"
        }
        description="Peran Anda hanya bisa melihat kas masuk."
        isCanView={isCanView}
        backHref={leaveHref}
        backLabel="Kembali ke Kas Masuk"
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Kas Masuk"
      />
    );
  }

  if (publicId && receipt && !isEditable(receipt.status)) {
    return (
      <div className="pb-8">
        <PageHeader
          title="Ubah Kas Masuk"
          subtitle={receipt.code}
          backHref={receiptHref(publicId)}
          isBackPersistent
        />
        <EmptyState
          title="Kas masuk ini tidak bisa diubah"
          description="Hanya draf yang bisa diubah. Yang sudah diterima dibalik lewat Batalkan, bukan diubah."
          action={
            <Link
              href={receiptHref(publicId)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lihat kas masuk
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
          title={
            isEdit
              ? "Ubah Kas Masuk"
              : isGateway
                ? "Catat Pencairan Payment Gateway"
                : "Tambah Kas Masuk"
          }
          subtitle={receipt?.code}
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={7} /> : null}

      {detail.error && !receipt ? (
        <div className="flex flex-col items-start gap-3 px-gutter py-5">
          <FormAlert
            title="Kas masuk gagal dimuat."
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

      <div className={isEdit && !receipt ? "hidden" : undefined}>
        <ReceiptSection form={form} isDisabled={isSubmitting} />
        <LineSection
          form={form}
          note={isGateway ? GATEWAY_NOTE : undefined}
          isDisabled={isSubmitting}
        />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {isGateway && gateway.isMissing ? (
          <>
            <FormAlert
              tone="warning"
              title="Setelan akun penampung persembahan online belum diisi."
              message="Pilih sendiri pos baris pertama, atau isi setelannya lebih dulu supaya terisi otomatis."
            />
            <FixLink fix={SETTING_LINK} />
          </>
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
