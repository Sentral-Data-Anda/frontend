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
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { FIRST_INVALID, applyServerError, revealField } from "@/lib/form-error";
import { saveListFocus } from "@/lib/list-return";

import { useEndMarriage, useMarriageDetail } from "../api";
import {
  EMPTY_END_FORM,
  MARRIAGE_LIST_PATH,
  coupleName,
  endMarriageFormSchema,
  toEndMarriagePayload,
  type EndMarriageFormValues,
} from "../model";

import { AlreadyEnded } from "./already-ended";
import { EndSection } from "./end-section";
import { NoFormAccess } from "./no-form-access";

interface PropTypes {
  id: string;
}

export const MarriageEndScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanUpdate } = useMenuAccess(MENU.PERNIKAHAN);
  const listReturn = useListReturn(MARRIAGE_LIST_PATH);
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const endMarriage = useEndMarriage(id);
  const detail = useMarriageDetail(id);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<EndMarriageFormValues>({
    resolver: zodResolver(endMarriageFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: EMPTY_END_FORM,
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;

  const onLeave = () => router.replace(listReturn);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenSaveConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("update");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenSaveConfirm, onInvalid)();
  };

  const onSave = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const saved = await endMarriage.mutateAsync(toEndMarriagePayload(values));

      toast.add({ title: saved.message });
      saveListFocus(MARRIAGE_LIST_PATH, saved.data.publicId);
      router.replace(listReturn);
    } catch (error) {
      setRejectedField(applyServerError(error, form.setError));
    }
  }, onInvalid);

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

  if (!isCanUpdate) return <NoFormAccess isEdit />;

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="pernikahan"
        backHref={listReturn}
        backLabel="Kembali ke Pernikahan"
      />
    );
  }

  if (detail.data?.endedAt) {
    return (
      <AlreadyEnded
        marriage={{ ...detail.data, endedAt: detail.data.endedAt }}
        backHref={listReturn}
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
            disabled={isSubmitting || detail.isLoading}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Akhiri Pernikahan"
          subtitle={detail.data ? coupleName(detail.data) : undefined}
          backHref={listReturn}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? (
        <LoadingForm fields={3} label="Memuat data pernikahan…" />
      ) : null}

      <div className={detail.isLoading ? "hidden" : undefined}>
        <EndSection form={form} isDisabled={isSubmitting} />
      </div>

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert
            title="Pernikahan belum diakhiri. Coba simpan lagi."
            message={rootError}
          />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="pernikahan"
        descriptions={{
          update: "Apakah Anda ingin mengakhiri pernikahan ini?",
        }}
        onSave={() => void onSave()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
