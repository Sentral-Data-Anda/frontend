"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import {
  ApprovalPanel,
  DescriptionSkeleton,
  Panel,
  SalaryDataBadge,
} from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  FormAlert,
  FormConfirmDialog,
  FormNotFound,
  useFormConfirm,
} from "@/components/common/form";
import { StepUpDialog } from "@/components/common/overlay";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";

import { useDeletePayroll, usePayrollAction, usePayrollDetail } from "../api";
import {
  CANCEL_QUESTION,
  CALCULATE_QUESTION,
  DELETE_QUESTION,
  FIX_HINT,
  LIST_PATH,
  LOCKED_DESCRIPTION,
  LOCKED_TITLE,
  NO_VIEW_DESCRIPTION,
  NO_VIEW_TITLE,
  PAY_QUESTION,
  RECALCULATE_QUESTION,
  RELOAD_HINT,
  RELOAD_TITLE,
  STEP_UP_DESCRIPTION,
  SUBMIT_QUESTION,
  periodLabel,
} from "../model";
import { PayrollStatusBadge } from "../ui";
import { useSalaryLock } from "../use-salary-lock";

import { PayrollActions, type PickedAction } from "./payroll-actions";
import { PayslipPanel } from "./payslip-panel";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Penggajian";

const FAILURE_TITLE: Record<PickedAction, string> = {
  hitung: "Penggajian belum dihitung.",
  pengajuan: "Pengajuan belum dikirim.",
  bayar: "Pembayaran belum dicatat.",
  batal: "Penggajian belum dibatalkan.",
  hapus: "Penggajian belum dihapus.",
};

const hintOf = (error: Error | null) =>
  error instanceof FetchError && error.code ? FIX_HINT[error.code] : undefined;

const isStale = (error: Error | null) =>
  error instanceof FetchError && error.code === "PAYROLL_RUN_CHANGED";

interface PropTypes {
  code: string;
}

export const PayrollDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.PAYROLL);
  const listReturn = useListReturn(LIST_PATH);
  const detail = usePayrollDetail(isCanView ? code : undefined);
  const action = usePayrollAction(code);
  const remove = useDeletePayroll(code);
  const confirm = useFormConfirm();
  const lock = useSalaryLock(detail.error, () => void detail.refetch());
  const [picked, setPicked] = useState<PickedAction>("hitung");
  const run = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;
  const pending = action.isPending || remove.isPending ? picked : null;
  const failure = action.error ?? remove.error;

  const onPick = (next: PickedAction) => {
    setPicked(next);
    confirm.onOpen(next === "batal" || next === "hapus" ? "delete" : "update");
  };

  const onRun = () => {
    if (picked === "hapus") {
      remove.mutate(undefined, {
        onSuccess: (response) => {
          toast.add({ title: response.message });
          router.replace(listReturn);
        },
      });

      return;
    }

    action.mutate(picked, {
      onSuccess: (response) => toast.add({ title: response.message }),
    });
  };

  const questionOf = (): string => {
    if (picked === "pengajuan") return SUBMIT_QUESTION;
    if (picked === "bayar") return PAY_QUESTION;
    if (picked === "batal") return CANCEL_QUESTION;
    if (picked === "hapus") return DELETE_QUESTION;

    return run?.status === "CALCULATED"
      ? RECALCULATE_QUESTION
      : CALCULATE_QUESTION;
  };

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.HR)} />

        <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
      </div>
    );
  }

  if (lock.isLocked) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        <EmptyState
          title={LOCKED_TITLE}
          description={LOCKED_DESCRIPTION}
          action={
            <Button type="button" onClick={lock.onAsk}>
              Masukkan password
            </Button>
          }
        />

        <StepUpDialog
          isOpen={lock.isAsking}
          onClose={lock.onClose}
          onVerified={lock.onVerified}
          description={STEP_UP_DESCRIPTION}
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="penggajian"
        backHref={listReturn}
        backLabel="Kembali ke Penggajian"
      />
    );
  }

  if (!run) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat penggajian"
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
                <DescriptionSkeleton label="Memuat penggajian" rows={6} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={periodLabel(run)}
        subtitle={run.code}
        backHref={listReturn}
        isBackPersistent
        action={
          <PayrollStatusBadge status={run.status} approval={run.approval} />
        }
      />

      <div className="space-y-4 px-gutter pb-4">
        <SalaryDataBadge />

        {failure ? (
          isStale(failure) ? (
            <div className="space-y-2">
              <FormAlert
                tone="warning"
                title={RELOAD_TITLE}
                message={`${failure.message} ${RELOAD_HINT}`}
              />
              <Button
                type="button"
                variant="outline"
                disabled={detail.isFetching}
                onClick={() => void detail.refetch()}
              >
                {detail.isFetching ? "Memuat…" : "Muat ulang"}
              </Button>
            </div>
          ) : (
            <FormAlert
              title={FAILURE_TITLE[picked]}
              message={[failure.message, hintOf(failure)]
                .filter(Boolean)
                .join(" ")}
            />
          )
        ) : null}

        <SummaryPanel run={run} />

        {run.approval ? <ApprovalPanel approval={run.approval} /> : null}

        <PayslipPanel run={run} />
      </div>

      <PayrollActions run={run} pendingAction={pending} onPick={onPick} />

      <FormConfirmDialog
        confirm={confirm}
        noun="penggajian"
        descriptions={{ update: questionOf(), delete: questionOf() }}
        onSave={onRun}
        onDelete={onRun}
      />
    </div>
  );
};
