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

import { useLoanDetail, useSaveLoan } from "../api";
import {
  NO_VIEW,
  PINJAMAN_PATH,
  emptyPinjamanForm,
  pinjamanFormSchema,
  pinjamanHref,
  toPinjamanForm,
  toPinjamanPayload,
  type PinjamanFormValues,
} from "../model";

import { LoanSection } from "./loan-section";

const NOUN = "pinjaman";

const BACK_LABEL = "Kembali ke Pinjaman";

interface PropTypes {
  publicId?: string;
}

export const PinjamanFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(MENU.LOAN);
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(PINJAMAN_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const saveLoan = useSaveLoan(publicId);
  const detail = useLoanDetail(isAllowed ? publicId : undefined);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<PinjamanFormValues>({
    resolver: zodResolver(pinjamanFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyPinjamanForm(),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const loan = detail.data;
  const isWaiting = isEdit && !loan;
  const backHref = publicId ? pinjamanHref(publicId) : listReturn;
  const title = isEdit ? "Ubah Pinjaman" : "Tambah Pinjaman";

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
      const saved = await saveLoan.mutateAsync(toPinjamanPayload(values));

      toast.add({ title: saved.message });
      saveListFocus(PINJAMAN_PATH, saved.data.publicId);
      form.reset(values);
      router.replace(pinjamanHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

  useEffect(() => {
    if (!loan) return;

    form.reset(toPinjamanForm(loan), { keepDirtyValues: true });
  }, [loan, form]);

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
            ? "Tidak bisa mengubah pinjaman"
            : "Tidak bisa menambah pinjaman"
        }
        description={
          isCanView ? "Peran Anda hanya bisa melihat pinjaman." : NO_VIEW
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
          subtitle={loan?.code}
          backHref={backHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={6} /> : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <LoanSection form={form} isDisabled={isSubmitting} />
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
