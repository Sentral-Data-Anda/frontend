"use client";

import { PackageCheck, Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { isEditable, orderEditHref, receiptCreateHref } from "../model";
import type { OrderAction, OrderDetail } from "../types";

const PENDING_LABEL: Record<OrderAction, string> = {
  batal: "Membatalkan…",
  tutup: "Menutup…",
  hapus: "Menghapus…",
};

const LINK_BUTTON =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

interface PropTypes {
  order: OrderDetail;
  pendingAction: OrderAction | null;
  onPick: (action: OrderAction) => void;
}

export const StatusActions = (props: PropTypes) => {
  const { order, pendingAction, onPick } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.PESANAN_PEMBELIAN);
  const receiptAccess = useMenuAccess(MENU.PENERIMAAN_BARANG);
  const isBusy = pendingAction !== null;
  const isFresh = isEditable(order);
  const isOpen =
    order.status === "ISSUED" || order.status === "PARTIALLY_RECEIVED";
  const isReceivable = isOpen && receiptAccess.isCanCreate;
  const isClosable = order.status === "PARTIALLY_RECEIVED" && isCanUpdate;
  const isChangeable = isFresh && (isCanUpdate || isCanDelete);

  const labelOf = (action: OrderAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isReceivable && !isClosable && !isChangeable) return null;

  return (
    <section
      aria-label="Aksi pesanan"
      className="flex flex-wrap items-center gap-2"
    >
      {isReceivable ? (
        <Link
          href={receiptCreateHref(order.code)}
          aria-disabled={isBusy || undefined}
          className={cn(buttonVariants(), LINK_BUTTON)}
        >
          <PackageCheck aria-hidden />
          Catat penerimaan
        </Link>
      ) : null}

      {isClosable ? (
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => onPick("tutup")}
        >
          {labelOf("tutup", "Tutup pesanan")}
        </Button>
      ) : null}

      {isFresh && isCanUpdate ? (
        <Link
          href={orderEditHref(order.code)}
          aria-disabled={isBusy || undefined}
          className={cn(buttonVariants({ variant: "outline" }), LINK_BUTTON)}
        >
          <Pencil aria-hidden />
          Ubah
        </Link>
      ) : null}

      {isFresh && isCanDelete ? (
        <>
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => onPick("batal")}
          >
            {labelOf("batal", "Batalkan")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("hapus")}
          >
            {labelOf("hapus", "Hapus")}
          </Button>
        </>
      ) : null}
    </section>
  );
};
