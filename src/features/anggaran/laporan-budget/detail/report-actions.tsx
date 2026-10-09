"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { reportEditHref, reportStateOf, type ReportState } from "../model";
import type { BudgetReportDetail, ReportAction } from "../types";

const LEAD: Record<ReportState, string> = {
  DRAFT:
    "Laporan masih bisa diubah. Ajukan bila rincian dan kwitansinya sudah lengkap.",
  PENDING_APPROVAL:
    "Laporan sedang menunggu tiga tanda tangan jabatan dan tidak bisa diubah. Tarik pengajuan bila ada yang perlu diperbaiki.",
  APPROVED:
    "Laporan sudah disetujui lengkap. Pencairan bulan berikutnya terbuka.",
};

const PENDING_LABEL: Record<ReportAction, string> = {
  pengajuan: "Mengajukan…",
  tarik: "Menarik…",
  hapus: "Menghapus…",
};

const LINK_BUSY =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

interface PropTypes {
  report: BudgetReportDetail;
  pendingAction: ReportAction | null;
  onPick: (action: ReportAction) => void;
}

export const ReportActions = (props: PropTypes) => {
  const { report, pendingAction, onPick } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.BUDGET_REALIZATION);
  const state = reportStateOf(report);
  const isBusy = pendingAction !== null;
  const isDraft = state === "DRAFT";
  const isWithdrawable =
    state === "PENDING_APPROVAL" &&
    isCanUpdate &&
    report.approval?.isSubmittedByViewer === true;
  const isAnyAction =
    (isDraft && (isCanUpdate || isCanDelete)) || isWithdrawable;

  const labelOf = (action: ReportAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isAnyAction) {
    return <p className="text-muted-foreground text-body">{LEAD[state]}</p>;
  }

  return (
    <section aria-label="Aksi laporan" className="space-y-3">
      <p className="text-muted-foreground text-body">{LEAD[state]}</p>

      <div className="flex flex-wrap items-center gap-2">
        {isDraft && isCanDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("hapus")}
          >
            {labelOf("hapus", "Hapus")}
          </Button>
        ) : null}

        {isDraft && isCanUpdate ? (
          <>
            <Link
              href={reportEditHref(report.publicId)}
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
      </div>
    </section>
  );
};
