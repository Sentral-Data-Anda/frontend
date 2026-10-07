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
  NoFormAccess,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, detailHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { applyServerError, FIRST_INVALID, revealField } from "@/lib/form-error";

import { usePermintaanDetail, useReject } from "../api";
import {
  PERMINTAAN_LIST_PATH,
  documentTitle,
  rejectSchema,
  type RejectFormValues,
} from "../model";

import { ReasonSection } from "./reason-section";
import { RequestSection } from "./request-section";

interface PropTypes {
  id: string;
}

export const PermintaanRejectScreen = (props: PropTypes) => {
  const { id } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView, isCanUpdate } = useMenuAccess(MENU.PERMINTAAN_PERSETUJUAN);
  const listReturn = useListReturn(PERMINTAAN_LIST_PATH);
  const detail = usePermintaanDetail(id, isCanUpdate);
  const reject = useReject(id);
  const confirm = useFormConfirm();
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: { note: "" },
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const request = detail.data;
  const backHref = detailHref(
    MENU.PERSETUJUAN,
    MENU.PERMINTAAN_PERSETUJUAN,
    id,
  );

  const onLeave = () => router.replace(backHref);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onOpenConfirm = () => {
    setRejectedField(null);
    confirm.onOpen("save");
  };

  const onConfirm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void form.handleSubmit(onOpenConfirm, onInvalid)();
  };

  const onReject = form.handleSubmit(async (values) => {
    form.clearErrors("root");
    setRejectedField(null);

    try {
      const rejected = await reject.mutateAsync({ note: values.note });

      toast.add({ title: rejected.message });
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

  useEffect(() => {
    if (isSubmitting || !rejectedField) return;

    if (rejectedField === "root") submitRef.current?.focus();
    else revealField(rejectedField);
  }, [isSubmitting, submitCount, rejectedField]);

  if (!isCanUpdate || request?.canSign === false) {
    return (
      <NoFormAccess
        title="Tidak bisa menolak permintaan ini"
        description={
          isCanUpdate
            ? "Permintaan ini tidak sedang menunggu tanda tangan Anda."
            : "Peran Anda hanya bisa melihat permintaan persetujuan."
        }
        backHref={backHref}
        backLabel="Kembali ke permintaan"
        isCanView={isCanView}
        isStateLocked={isCanUpdate}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound
        noun="permintaan persetujuan"
        backHref={listReturn}
        backLabel="Kembali ke Permintaan Persetujuan"
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
            ref={submitRef}
            type="submit"
            variant="destructive"
            disabled={isSubmitting || !request}
          >
            {isSubmitting ? "Menolak…" : "Tolak permintaan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title="Tolak permintaan"
          subtitle={request?.code}
          backHref={backHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {request ? (
        <>
          <RequestSection request={request} />
          <ReasonSection form={form} isDisabled={isSubmitting} />
        </>
      ) : detail.error ? (
        <div className="space-y-3 px-gutter py-5">
          <FormAlert
            title="Permintaan gagal dimuat."
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
      ) : (
        <LoadingForm fields={3} label="Memuat permintaan…" />
      )}

      <div className="space-y-3 px-gutter pb-4 empty:hidden">
        {rootError ? (
          <FormAlert title="Permintaan belum ditolak." message={rootError} />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun="penolakan"
        descriptions={{
          save: `Tolak ${request ? documentTitle(request) : "permintaan ini"}? Permintaan berakhir di tahap ini dan pengaju perlu mengajukan ulang.`,
        }}
        onSave={() => void onReject()}
        onLeave={onLeave}
      />
    </FormLayout>
  );
};
