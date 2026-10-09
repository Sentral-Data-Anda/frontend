"use client";

import { Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import {
  ApprovalPanel,
  DescriptionSkeleton,
  Panel,
} from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  FormAlert,
  FormConfirmDialog,
  FormNotFound,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useReportAction, useReportDetail } from "../api";
import {
  NO_VIEW,
  REPORT_LIST_PATH,
  REPORT_SUBMIT_TEXT,
  REPORT_WITHDRAW_TEXT,
  pendingStepText,
  rejectedMessageOf,
  rejectedStepOf,
  rejectedTitleOf,
  reportDeleteText,
  reportStateOf,
  varianceOf,
} from "../model";
import type { ReportAction } from "../types";
import { ReportStatusBadge } from "../ui";

import { FailureAlert } from "./failure-alert";
import { LineList } from "./line-list";
import { PrintHeader } from "./print-header";
import { ReceiptList } from "./receipt-list";
import { ReportActions } from "./report-actions";
import { StepRow } from "./step-row";
import { SubmitChecklist } from "./submit-checklist";
import { SummaryPanel } from "./summary-panel";
import { VarianceStrip } from "./variance-strip";
import { WaiverPanel } from "./waiver-panel";

const TITLE = "Budget Realization";

const NOUN = "laporan pemakaian budget";

const FAILURE_TITLE: Record<ReportAction, string> = {
  pengajuan: "Laporan belum diajukan.",
  tarik: "Pengajuan belum ditarik.",
  hapus: "Laporan belum dihapus.",
};

interface PropTypes {
  publicId: string;
}

export const ReportDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.BUDGET_REALIZATION);
  const listReturn = useListReturn(REPORT_LIST_PATH);
  const detail = useReportDetail(isCanView ? publicId : undefined);
  const action = useReportAction(publicId);
  const confirm = useFormConfirm();
  const [pickAction, setPickAction] = useState<ReportAction>("pengajuan");
  const report = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const rejected = rejectedStepOf(report?.approval ?? null);

  const onPick = (next: ReportAction) => {
    setPickAction(next);
    confirm.onOpen(next === "pengajuan" ? "update" : "delete");
  };

  const onRun = (next: ReportAction) =>
    action.mutate(next, {
      onSuccess: (response) => {
        toast.add({ title: response.message });
        if (next === "hapus") router.replace(listReturn);
      },
    });

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.REPORT)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Budget Realization"
          description={NO_VIEW}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun={NOUN}
        backHref={listReturn}
        backLabel="Kembali ke Laporan Budget"
      />
    );
  }

  if (!report) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat laporan"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                >
                  {detail.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="px-gutter">
            <Panel>
              <div className="px-gutter py-2">
                <DescriptionSkeleton label="Memuat laporan" rows={5} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  const variance = varianceOf(report.disbursementTotal, report.totalAmount);

  return (
    <div className="pb-8">
      <PageHeader
        title={report.label}
        subtitle={[report.code, report.bapel?.name].filter(Boolean).join(" · ")}
        backHref={listReturn}
        isBackPersistent
        action={
          <div className="flex items-center gap-2">
            <ReportStatusBadge report={report} />

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => window.print()}
            >
              <Printer aria-hidden />
              Cetak
            </Button>
          </div>
        }
      />

      <PrintHeader report={report} />

      <div className="space-y-4 px-gutter pb-4">
        {rejected ? (
          <FormAlert
            tone="warning"
            title={rejectedTitleOf(rejected)}
            message={rejectedMessageOf(rejected)}
          />
        ) : null}

        {report.waiver ? <WaiverPanel waiver={report.waiver} /> : null}

        <VarianceStrip variance={variance} />

        {reportStateOf(report) === "DRAFT" ? (
          <div className="print:hidden">
            <SubmitChecklist
              report={report}
              variance={variance}
              error={action.error}
            />
          </div>
        ) : null}

        <div className="print:hidden">
          <ReportActions
            report={report}
            pendingAction={action.isPending ? (action.variables ?? null) : null}
            onPick={onPick}
          />
        </div>

        {action.error ? (
          <FailureAlert
            title={FAILURE_TITLE[action.variables ?? pickAction]}
            error={action.error}
          />
        ) : null}

        {report.approval ? (
          <ApprovalPanel
            approval={report.approval}
            pendingText={pendingStepText(report.approval)}
            renderStep={(step) => <StepRow step={step} />}
          />
        ) : null}

        <SummaryPanel report={report} />

        <LineList lines={report.lines} />

        {report.listReceipt.length > 0 ? (
          <ReceiptList receipts={report.listReceipt} />
        ) : null}
      </div>

      <FormConfirmDialog
        confirm={confirm}
        noun={NOUN}
        descriptions={{
          update: REPORT_SUBMIT_TEXT,
          delete:
            pickAction === "tarik"
              ? REPORT_WITHDRAW_TEXT
              : reportDeleteText(report),
        }}
        onSave={() => onRun("pengajuan")}
        onDelete={() => onRun(pickAction)}
      />
    </div>
  );
};
