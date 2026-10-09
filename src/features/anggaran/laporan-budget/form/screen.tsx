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

import { usePrefill, useReportDetail, useSaveReport } from "../api";
import { VarianceStrip } from "../detail";
import {
  NO_VIEW,
  PREFILL_EMPTY_MESSAGE,
  PREFILL_EMPTY_TITLE,
  REPORT_LIST_PATH,
  emptyLine,
  clearPrograms,
  emptyReportForm,
  formTotal,
  isLinesFilled,
  isRefillAsked,
  prefillToLines,
  previousMonthOf,
  reportDetailHref,
  reportFormSchema,
  reportStateOf,
  toReportForm,
  toReportFormData,
  toFormError,
  serverFieldError,
  varianceOf,
  type ReportFormValues,
} from "../model";

import { LineSection } from "./line-section";
import { PrefillDialog } from "./prefill-dialog";
import { ReceiptSection } from "./receipt-section";
import { ReportSection } from "./report-section";

const NOUN = "laporan pemakaian budget";

const BACK_LABEL = "Kembali ke Laporan Budget";

interface PropTypes {
  publicId?: string;
}

export const ReportFormScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const isEdit = Boolean(publicId);
  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(
    MENU.BUDGET_REALIZATION,
  );
  const isAllowed = isEdit ? isCanUpdate : isCanCreate;
  const listReturn = useListReturn(REPORT_LIST_PATH);
  const leaveHref = publicId ? reportDetailHref(publicId) : listReturn;
  const [rejectedField, setRejectedField] = useState<string | null>(null);
  const detail = useReportDetail(isAllowed && isEdit ? publicId : undefined);
  const saveReport = useSaveReport(publicId);
  const confirm = useFormConfirm();
  const saveRef = useRef<HTMLButtonElement>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
    defaultValues: emptyReportForm(
      searchParams.get("bulan") || previousMonthOf(),
      isEdit ? "" : (searchParams.get("komisi") ?? ""),
    ),
  });

  const { isDirty, isSubmitting, submitCount } = form.formState;
  const rootError = form.formState.errors.root?.message;
  const report = detail.data;
  const pickBapel = useWatch({ control: form.control, name: "bapelId" });
  const pickMonth = useWatch({ control: form.control, name: "month" });
  const lines = useWatch({ control: form.control, name: "lines" });
  const settledKey = useWatch({ control: form.control, name: "prefillKey" });
  const prefill = usePrefill(pickBapel, pickMonth, true);
  const prefillKey = `${pickBapel}|${pickMonth}`;
  const isWaiting = isEdit && !report;
  const isLocked = report ? reportStateOf(report) !== "DRAFT" : false;
  const title = isEdit ? "Ubah Laporan Budget" : "Tambah Laporan Budget";
  const prefillTotal = prefill.data?.total ?? "0";
  const isPrefillEmpty =
    !isEdit && prefill.data !== undefined && prefill.data.lines.length === 0;
  const isRefillOpen = isRefillAsked({
    isEdit,
    isPrefillReady: prefill.data !== undefined,
    prefillKey,
    settledKey,
    lines: lines ?? [],
  });

  const onLeave = () => router.replace(leaveHref);

  const onInvalid = () => setRejectedField(FIRST_INVALID);

  const onRefill = () => {
    const next = prefill.data ? prefillToLines(prefill.data) : [];

    form.setValue("lines", next.length > 0 ? next : [emptyLine()], {
      shouldDirty: true,
    });
    form.setValue("prefillKey", prefillKey);
  };

  const onKeepLines = () => form.setValue("prefillKey", prefillKey);

  const onPickBapel = (value: string) => {
    form.setValue("bapelId", value, { shouldDirty: true });
    form.setValue("lines", clearPrograms(form.getValues("lines")), {
      shouldDirty: true,
    });
  };

  const onPickMonth = (value: string) =>
    form.setValue("month", value, { shouldDirty: true });

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
      const saved = await saveReport.mutateAsync(
        toReportFormData(values, isEdit),
      );

      toast.add({ title: saved.message });
      saveListFocus(REPORT_LIST_PATH, saved.data.publicId);
      form.reset(values);
      router.replace(reportDetailHref(saved.data.publicId));
    } catch (error) {
      setRejectedField(
        applyServerError(toFormError(error), form.setError, serverFieldError),
      );
    }
  }, onInvalid);

  useEffect(() => {
    if (!report) return;

    form.reset(toReportForm(report), { keepDirtyValues: true });
    form.setValue(
      "receipts",
      withFreshUrls(form.getValues("receipts"), report.listReceipt),
    );
  }, [report, form]);

  useEffect(() => {
    const data = prefill.data;

    if (isEdit || !data || prefillKey === form.getValues("prefillKey")) return;
    if (isLinesFilled(form.getValues("lines"))) return;

    const next = prefillToLines(data);

    form.setValue("lines", next.length > 0 ? next : [emptyLine()], {
      shouldDirty: true,
    });
    form.setValue("prefillKey", prefillKey);
  }, [isEdit, prefill.data, prefillKey, form]);

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
          isEdit ? "Tidak bisa mengubah laporan" : "Tidak bisa menambah laporan"
        }
        description={
          isCanView ? "Peran Anda hanya bisa melihat laporan." : NO_VIEW
        }
        backHref={leaveHref}
        backLabel={BACK_LABEL}
      />
    );
  }

  if (detail.error instanceof FetchError && detail.error.status === 404) {
    return (
      <FormNotFound noun={NOUN} backHref={listReturn} backLabel={BACK_LABEL} />
    );
  }

  if (isLocked) {
    return (
      <NoFormAccess
        title="Laporan ini tidak bisa diubah"
        description="Hanya Draf tanpa permintaan persetujuan terbuka yang bisa disunting. Tarik pengajuannya lebih dulu."
        backHref={leaveHref}
        backLabel="Kembali ke laporan"
        isStateLocked
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
            disabled={isSubmitting || isWaiting}
          >
            {isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </FormActions>
      }
      header={
        <PageHeader
          title={title}
          subtitle={report?.code}
          backHref={leaveHref}
          isBackPersistent
          onBack={confirm.onBack(isDirty)}
        />
      }
    >
      {detail.isLoading ? <LoadingForm fields={5} /> : null}

      <div className={isWaiting ? "hidden" : undefined}>
        <ReportSection
          form={form}
          isDisabled={isSubmitting}
          onPickBapel={onPickBapel}
          onPickMonth={onPickMonth}
        />

        {isPrefillEmpty ? (
          <div className="px-gutter pb-4">
            <FormAlert
              tone="info"
              title={PREFILL_EMPTY_TITLE}
              message={PREFILL_EMPTY_MESSAGE}
            />
          </div>
        ) : null}

        <LineSection form={form} isDisabled={isSubmitting} />

        <div className="px-gutter pb-4">
          <VarianceStrip
            variance={varianceOf(prefillTotal, formTotal(lines ?? []))}
          />
        </div>

        <ReceiptSection form={form} isDisabled={isSubmitting} />
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

      <PrefillDialog
        isOpen={isRefillOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && isRefillOpen) onKeepLines();
        }}
        onConfirm={onRefill}
      />
    </FormLayout>
  );
};
