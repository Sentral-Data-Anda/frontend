"use client";

import { CheckCheck, Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import {
  isCancellable,
  isCompletable,
  isEditable,
  returnEditHref,
} from "../model";
import type { PurchaseReturn, ReturnAction, ReturnStatus } from "../types";

const LEAD: Record<ReturnStatus, string> = {
  DRAFT:
    "Retur masih bisa diubah. Ajukan bila baris dan jumlahnya sudah benar.",
  SUBMITTED:
    "Retur sudah diajukan dan tidak bisa diubah. Selesaikan setelah disetujui. Bila pengajuannya ditolak atau ditarik, retur ini hanya bisa dibatalkan.",
  COMPLETED:
    "Barang sudah dikembalikan: stok keluar dan barang aset dicabut dari daftar.",
  CANCELLED: "Retur dibatalkan dan tidak bisa dilanjutkan.",
};

const PENDING_LABEL: Record<ReturnAction, string> = {
  pengajuan: "Mengajukan…",
  selesai: "Menyelesaikan…",
  batal: "Membatalkan…",
  hapus: "Menghapus…",
};

const LINK_BUSY =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

interface PropTypes {
  row: PurchaseReturn;
  pendingAction: ReturnAction | null;
  onPick: (action: ReturnAction) => void;
}

export const StatusActions = (props: PropTypes) => {
  const { row, pendingAction, onPick } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.PURCHASE_RETURN);
  const isBusy = pendingAction !== null;
  const isDraft = isEditable(row);
  const isDraftAction = isDraft && (isCanUpdate || isCanDelete);
  const isFinishable = isCompletable(row) && isCanUpdate;
  const isAbandonable = isCancellable(row) && !isDraft && isCanDelete;
  const isAnyAction = isDraftAction || isFinishable || isAbandonable;

  const labelOf = (action: ReturnAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isAnyAction) return null;

  return (
    <section aria-label="Aksi retur" className="space-y-3">
      <p className="text-muted-foreground text-body">{LEAD[row.status]}</p>

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
              href={returnEditHref(row.publicId)}
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

        {isAbandonable ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("batal")}
          >
            {labelOf("batal", "Batalkan")}
          </Button>
        ) : null}

        {isFinishable ? (
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => onPick("selesai")}
          >
            <CheckCheck aria-hidden />
            {labelOf("selesai", "Selesaikan")}
          </Button>
        ) : null}
      </div>
    </section>
  );
};
