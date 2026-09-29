"use client";

import { Copy, Pencil, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { orderCreateHref, requestEditHref, resubmitHref } from "../model";
import type { PurchaseRequestDetail, RequestAction } from "../types";

const LEAD: Partial<Record<PurchaseRequestDetail["status"], string>> = {
  DRAFT:
    "Permintaan masih bisa diubah. Ajukan bila barang dan perkiraan harga sudah lengkap.",
  PENDING_APPROVAL:
    "Permintaan sedang menunggu persetujuan dan tidak bisa diubah.",
  REJECTED:
    "Permintaan ditolak dan tidak bisa diubah. Ajukan ulang sebagai permintaan baru.",
  APPROVED: "Permintaan disetujui. Barangnya boleh dipesan ke supplier.",
};

const PENDING_LABEL: Record<RequestAction, string> = {
  pengajuan: "Mengajukan…",
  tarik: "Menarik…",
  hapus: "Menghapus…",
};

const LINK_BUSY =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

interface PropTypes {
  request: PurchaseRequestDetail;
  pendingAction: RequestAction | null;
  onPick: (action: RequestAction) => void;
}

export const StatusActions = (props: PropTypes) => {
  const { request, pendingAction, onPick } = props;

  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.PERMINTAAN_PEMBELIAN,
  );
  const { isCanCreate: isCanOrder } = useMenuAccess(MENU.PESANAN_PEMBELIAN);
  const { status } = request;
  const isBusy = pendingAction !== null;
  const isDraft = status === "DRAFT";
  const isWithdrawable =
    status === "PENDING_APPROVAL" &&
    isCanUpdate &&
    request.approval?.isSubmittedByViewer === true;
  const isResubmittable = status === "REJECTED" && isCanCreate;
  const isOrderable = status === "APPROVED" && isCanOrder;
  const isDraftAction = isDraft && (isCanUpdate || isCanDelete);
  const isAnyAction =
    isDraftAction || isWithdrawable || isResubmittable || isOrderable;

  const labelOf = (action: RequestAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isAnyAction) return null;

  return (
    <section aria-label="Aksi permintaan" className="space-y-3">
      <p className="text-muted-foreground text-body">{LEAD[status]}</p>

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
              href={requestEditHref(request.code)}
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

        {isResubmittable ? (
          <Link
            href={resubmitHref(request.code)}
            className={cn(buttonVariants(), LINK_BUSY)}
          >
            <Copy aria-hidden />
            Ajukan ulang
          </Link>
        ) : null}

        {isOrderable ? (
          <Link
            href={orderCreateHref(request.code)}
            className={cn(buttonVariants(), LINK_BUSY)}
          >
            <ShoppingCart aria-hidden />
            Buat pesanan
          </Link>
        ) : null}
      </div>
    </section>
  );
};
