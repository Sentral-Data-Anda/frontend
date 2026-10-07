"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState, useToast } from "@/components/common/feedback";
import {
  FormConfirmDialog,
  FormNotFound,
  useFormConfirm,
} from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { monthLabel } from "@/lib/date";
import { formatAmount } from "@/lib/format";

import { useExpenseAction, useExpenseDetail, useGateCompliance } from "../api";
import { EXPENSE_LIST_PATH, NO_VIEW, previousMonthOf } from "../model";
import type { CashExpenseDetail, ExpenseAction } from "../types";
import { ExpenseStateBadge } from "../ui";

import { ApprovalPanel } from "./approval-panel";
import { CancelPanel } from "./cancel-panel";
import { ExpenseActions } from "./expense-actions";
import { FailureAlert } from "./failure-alert";
import { LineList } from "./line-list";
import { NoteList } from "./note-list";
import { SummaryPanel } from "./summary-panel";
import { WaiveDialog } from "./waive-dialog";
import { WaiverPanel } from "./waiver-panel";

const TITLE = "Kas Keluar";

const NOUN = "kas keluar";

const FAILURE_TITLE: Record<ExpenseAction, string> = {
  pengajuan: "Kas keluar belum diajukan.",
  tarik: "Pengajuan belum ditarik.",
  bayar: "Pembayaran belum dicatat.",
  batal: "Kas keluar belum dibatalkan.",
  hapus: "Kas keluar belum dihapus.",
};

const SUBMIT_TEXT =
  "Apakah Anda ingin mengajukan kas keluar ini untuk disetujui? Rinciannya terkunci selama menunggu.";

const PAY_TEXT =
  "Apakah Anda ingin mencatat pembayaran ini? Uang dicatat keluar dan pembukuannya dibuat.";

const WITHDRAW_TEXT =
  "Apakah Anda ingin menarik pengajuan ini? Kas keluar kembali menjadi Draf.";

const CANCEL_TEXT =
  "Apakah Anda ingin membatalkan kas keluar ini? Pembatalan yang sudah dibayar menulis entri pembalikan di jurnal.";

interface PropTypes {
  publicId: string;
}

export const ExpenseDetailScreen = (props: PropTypes) => {
  const { publicId } = props;

  const router = useRouter();
  const toast = useToast();
  const { isCanView } = useMenuAccess(MENU.KAS_KELUAR);
  const listReturn = useListReturn(EXPENSE_LIST_PATH);
  const detail = useExpenseDetail(isCanView ? publicId : undefined);
  const action = useExpenseAction(publicId);
  const confirm = useFormConfirm();
  const isCancelOpen = useBoolean();
  const isWaiveOpen = useBoolean();
  const [pickAction, setPickAction] = useState<ExpenseAction>("pengajuan");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const expense = detail.data;
  const gateMonth = previousMonthOf(expense?.expenseDate.slice(0, 10) ?? "");
  const gate = useGateCompliance(
    expense?.bapelId === null || expense?.bapelId === undefined
      ? ""
      : String(expense.bapelId),
    gateMonth.year,
    gateMonth.month,
  );
  // Bebaskan hanya bila gerbang MEMANG akan menolak. `NOT_DUE` (nol pencairan
  // M−1), `APPROVED`, dan yang sudah dibebaskan tidak punya apa pun untuk
  // dibebaskan — menawarkannya di situ mengiklankan pintu yang tidak dibutuhkan.
  const isWaivable =
    gate.data?.state === "DRAFT" || gate.data?.state === "MISSING";
  const gateLabel = monthLabel(
    `${gateMonth.year}-${String(gateMonth.month).padStart(2, "0")}`,
  );
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  const header = (
    title: string,
    subtitle?: string,
    row?: Pick<CashExpenseDetail, "status" | "approval">,
  ) => (
    <PageHeader
      title={title}
      subtitle={subtitle}
      backHref={listReturn}
      isBackPersistent
      action={row ? <ExpenseStateBadge expense={row} /> : null}
    />
  );

  const onRun = (next: ExpenseAction, cancelReason?: string) =>
    action.mutate(
      { action: next, cancelReason },
      {
        onSuccess: (response) => {
          toast.add({ title: response.message });
          isCancelOpen.onFalse();
          if (next === "hapus") router.replace(listReturn);
        },
      },
    );

  const onPick = (next: ExpenseAction) => {
    setPickAction(next);

    if (next === "batal") isCancelOpen.onTrue();
    else confirm.onOpen(next === "bayar" ? "update" : "delete");
  };

  const onOpenCancelConfirm = () => {
    if (!reason.trim()) {
      setReasonError("Isi alasan pembatalan");

      return;
    }

    setReasonError(undefined);
    confirm.onOpen("delete");
  };

  const onDismissCancel = () => {
    isCancelOpen.onFalse();
    setReasonError(undefined);
  };

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.KEUANGAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Kas Keluar"
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
        backLabel="Kembali ke Kas Keluar"
      />
    );
  }

  if (!expense) {
    return (
      <div className="pb-8">
        {header(TITLE)}

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat kas keluar"
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
                <DescriptionSkeleton label="Memuat kas keluar" rows={6} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      {header(
        expense.payee,
        [expense.code, expense.bapel?.name].filter(Boolean).join(" · "),
        expense,
      )}

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel expense={expense} />

        {expense.approval ? (
          <ApprovalPanel
            approval={expense.approval}
            approvedBy={expense.approvedBy}
            approvedAt={expense.approvedAt}
          />
        ) : null}

        {expense.waiver ? (
          <WaiverPanel waiver={expense.waiver} label={gateLabel} />
        ) : null}

        <ExpenseActions
          expense={expense}
          pendingAction={
            action.isPending ? (action.variables?.action ?? null) : null
          }
          isWaivable={isWaivable}
          onPick={onPick}
          onWaive={isWaiveOpen.onTrue}
        />

        {isCancelOpen.value ? (
          <CancelPanel
            value={reason}
            error={reasonError}
            isBusy={action.isPending}
            onValueChange={setReason}
            onSubmit={onOpenCancelConfirm}
            onDismiss={onDismissCancel}
          />
        ) : null}

        {action.error ? (
          <FailureAlert
            title={FAILURE_TITLE[action.variables?.action ?? pickAction]}
            error={action.error}
            expense={expense}
          />
        ) : null}

        <h2 className="text-title pt-2 font-semibold">Rincian</h2>
      </div>

      <LineList lines={expense.lines} isRefreshing={detail.isFetching} />

      <p className="px-gutter pt-3 text-right text-body font-medium tabular-nums">
        Total {formatAmount(expense.totalAmount)}
      </p>

      {expense.attachments.length > 0 ? (
        <div className="space-y-3 px-gutter pt-6">
          <h2 className="text-title font-semibold">Nota</h2>
          <NoteList notes={expense.attachments} />
        </div>
      ) : null}

      {expense.bapelId !== null ? (
        <WaiveDialog
          bapelId={expense.bapelId}
          bapelName={expense.bapel?.name ?? "badan pelayanan ini"}
          year={gateMonth.year}
          month={gateMonth.month}
          label={gateLabel}
          isOpen={isWaiveOpen.value}
          onClose={isWaiveOpen.onFalse}
          onWaived={() => {
            isWaiveOpen.onFalse();
            toast.add({ title: "Berhasil membebaskan pencairan" });
          }}
        />
      ) : null}

      <FormConfirmDialog
        confirm={confirm}
        noun={NOUN}
        descriptions={{
          update: pickAction === "bayar" ? PAY_TEXT : SUBMIT_TEXT,
          delete:
            pickAction === "tarik"
              ? WITHDRAW_TEXT
              : pickAction === "batal"
                ? CANCEL_TEXT
                : undefined,
        }}
        onSave={() => onRun(pickAction)}
        onDelete={() =>
          onRun(pickAction, pickAction === "batal" ? reason.trim() : undefined)
        }
      />
    </div>
  );
};
