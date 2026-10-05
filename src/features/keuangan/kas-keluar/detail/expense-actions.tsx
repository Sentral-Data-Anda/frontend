"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { expenseEditHref, expenseStateOf, isLocked } from "../model";
import type { CashExpenseDetail, ExpenseAction, ExpenseState } from "../types";

const LEAD: Record<ExpenseState, string> = {
  DRAFT:
    "Masih draf. Ajukan bila penerima, pos, dan nominalnya sudah benar — uang belum keluar.",
  PENDING_APPROVAL:
    "Menunggu tanda tangan. Rinciannya terkunci sampai diputus atau ditarik.",
  APPROVED:
    "Sudah disetujui. Catat pembayarannya supaya uangnya tercatat keluar.",
  PAID: "Uang sudah tercatat keluar dan pembukuannya dibuat.",
  CANCELLED: "Kas keluar ini dibatalkan.",
};

const PENDING_LABEL: Record<ExpenseAction, string> = {
  pengajuan: "Mengajukan…",
  tarik: "Menarik…",
  bayar: "Membayar…",
  batal: "Membatalkan…",
  hapus: "Menghapus…",
};

const LINK_BUSY =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

interface PropTypes {
  expense: CashExpenseDetail;
  pendingAction: ExpenseAction | null;
  isWaivable: boolean;
  onPick: (action: ExpenseAction) => void;
  onWaive: () => void;
}

export const ExpenseActions = (props: PropTypes) => {
  const { expense, pendingAction, isWaivable, onPick, onWaive } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.KAS_KELUAR);
  const state = expenseStateOf(expense);
  const isBusy = pendingAction !== null;
  const isDraftOpen = expense.status === "DRAFT" && !isLocked(expense);
  const isWithdrawable =
    isLocked(expense) &&
    isCanUpdate &&
    expense.approval?.isSubmittedByViewer === true;
  const isPayable = expense.status === "APPROVED" && isCanUpdate;
  const isCancellable =
    (expense.status === "APPROVED" || expense.status === "PAID") && isCanDelete;
  const isWaiveShown =
    isWaivable && isCanUpdate && expense.status === "APPROVED";
  const isAnyAction =
    (isDraftOpen && (isCanUpdate || isCanDelete)) ||
    isWithdrawable ||
    isPayable ||
    isCancellable ||
    isWaiveShown;

  const labelOf = (action: ExpenseAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isAnyAction) return null;

  return (
    <section aria-label="Aksi kas keluar" className="space-y-3">
      <p className="text-muted-foreground text-body">{LEAD[state]}</p>

      <div className="flex flex-wrap items-center gap-2">
        {isDraftOpen && isCanDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("hapus")}
          >
            {labelOf("hapus", "Hapus")}
          </Button>
        ) : null}

        {isDraftOpen && isCanUpdate ? (
          <>
            <Link
              href={expenseEditHref(expense.publicId)}
              aria-disabled={isBusy || undefined}
              className={cn(buttonVariants({ variant: "outline" }), LINK_BUSY)}
            >
              <Pencil aria-hidden />
              Ubah
            </Link>
            <Button
              type="button"
              disabled={isBusy}
              onClick={() => onPick("pengajuan")}
            >
              {labelOf("pengajuan", "Ajukan")}
            </Button>
          </>
        ) : null}

        {isWithdrawable ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("tarik")}
          >
            {labelOf("tarik", "Tarik pengajuan")}
          </Button>
        ) : null}

        {isCancellable ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("batal")}
          >
            {labelOf("batal", "Batalkan")}
          </Button>
        ) : null}

        {isWaiveShown ? (
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={onWaive}
          >
            Bebaskan pencairan
          </Button>
        ) : null}

        {isPayable ? (
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => onPick("bayar")}
          >
            {labelOf("bayar", "Bayar")}
          </Button>
        ) : null}
      </div>
    </section>
  );
};
