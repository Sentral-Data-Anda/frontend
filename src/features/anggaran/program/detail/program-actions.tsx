"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { programEditHref, programStateOf } from "../model";
import type { ProgramAction, ProgramDetail } from "../types";

const LEAD: Record<string, string> = {
  DRAFT:
    "Usulan masih bisa diubah. Ajukan bila rincian anggarannya sudah lengkap.",
  PENDING_APPROVAL:
    "Usulan sedang menunggu tanda tangan dan tidak bisa diubah. Tarik pengajuan bila ada yang perlu diperbaiki.",
  APPROVED: "Usulan sudah disetujui Majelis.",
  CANCELLED: "Usulan dibatalkan. Pagunya sudah kembali tersedia.",
};

const PENDING_LABEL: Record<ProgramAction, string> = {
  pengajuan: "Mengajukan…",
  tarik: "Menarik…",
  hapus: "Menghapus…",
};

const LINK_BUSY =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

interface PropTypes {
  program: ProgramDetail;
  pendingAction: ProgramAction | null;
  isSubmitBlocked: boolean;
  blockedReason: string | null;
  onPick: (action: ProgramAction) => void;
  onCancel: () => void;
}

export const ProgramActions = (props: PropTypes) => {
  const {
    program,
    pendingAction,
    isSubmitBlocked,
    blockedReason,
    onPick,
    onCancel,
  } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.PROGRAM);
  const state = programStateOf(program);
  const isBusy = pendingAction !== null;
  const isDraft = state === "DRAFT";
  const isWithdrawable =
    state === "PENDING_APPROVAL" &&
    isCanUpdate &&
    program.approval?.isSubmittedByViewer === true;
  const isCancellable =
    (state === "DRAFT" || state === "APPROVED") && isCanDelete;
  const isAnyAction =
    (isDraft && (isCanUpdate || isCanDelete)) ||
    isWithdrawable ||
    isCancellable;

  const labelOf = (action: ProgramAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isAnyAction) {
    return <p className="text-muted-foreground text-body">{LEAD[state]}</p>;
  }

  return (
    <section aria-label="Aksi usulan" className="space-y-3">
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
              href={programEditHref(program.publicId)}
              aria-disabled={isBusy || undefined}
              className={cn(buttonVariants({ variant: "outline" }), LINK_BUSY)}
            >
              <Pencil aria-hidden />
              Ubah
            </Link>
            <Button
              type="button"
              disabled={isBusy || isSubmitBlocked}
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
            variant="outline"
            disabled={isBusy}
            onClick={onCancel}
          >
            Batalkan
          </Button>
        ) : null}
      </div>

      {isSubmitBlocked && blockedReason ? (
        <p className="text-body">{blockedReason}</p>
      ) : null}
    </section>
  );
};
