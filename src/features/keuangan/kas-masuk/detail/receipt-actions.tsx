"use client";

import { Check, Pencil } from "lucide-react";
import Link from "next/link";

import { Button, Textarea, buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import {
  isCancellable,
  isEditable,
  isReceivable,
  receiptEditHref,
} from "../model";
import type { CashReceiptDetail, ReceiptAction } from "../types";

const PENDING_LABEL: Record<ReceiptAction, string> = {
  terima: "Mencatat…",
  batal: "Membatalkan…",
  hapus: "Menghapus…",
};

const LINK_BUTTON =
  "cursor-pointer aria-disabled:pointer-events-none aria-disabled:opacity-50";

const REASON_ID = "cancel-reason";

interface PropTypes {
  receipt: CashReceiptDetail;
  pendingAction: ReceiptAction | null;
  cancelReason: string;
  onPickReason: (value: string) => void;
  onPick: (action: ReceiptAction) => void;
}

export const ReceiptActions = (props: PropTypes) => {
  const { receipt, pendingAction, cancelReason, onPickReason, onPick } = props;

  const { isCanUpdate, isCanDelete } = useMenuAccess(MENU.KAS_MASUK);
  const isBusy = pendingAction !== null;
  const isDraft = isEditable(receipt.status);
  const isReceiveShown = isReceivable(receipt.status) && isCanUpdate;
  const isCancelShown = isCancellable(receipt.status) && isCanDelete;

  const labelOf = (action: ReceiptAction, idle: string) =>
    pendingAction === action ? PENDING_LABEL[action] : idle;

  if (!isReceiveShown && !isCancelShown && !(isDraft && isCanDelete)) {
    return null;
  }

  return (
    <section aria-label="Aksi kas masuk" className="space-y-3">
      {isCancelShown ? (
        <div className="max-w-prose space-y-1.5">
          <label htmlFor={REASON_ID} className="block text-body font-medium">
            Alasan pembatalan
          </label>
          <Textarea
            id={REASON_ID}
            value={cancelReason}
            onChange={(event) => onPickReason(event.target.value)}
            disabled={isBusy}
            maxLength={250}
            rows={2}
            placeholder="mis. Uang dikembalikan karena acara dibatalkan"
          />
          <p className="text-muted-foreground text-caption">
            Alasan wajib diisi dan tersimpan bersama pembatalannya.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {isReceiveShown ? (
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => onPick("terima")}
          >
            <Check aria-hidden />
            {labelOf("terima", "Terima")}
          </Button>
        ) : null}

        {isDraft && isCanUpdate ? (
          <Link
            href={receiptEditHref(receipt.publicId)}
            aria-disabled={isBusy || undefined}
            className={cn(buttonVariants({ variant: "outline" }), LINK_BUTTON)}
          >
            <Pencil aria-hidden />
            Ubah
          </Link>
        ) : null}

        {isCancelShown ? (
          <Button
            type="button"
            variant="outline"
            disabled={isBusy || cancelReason.trim().length === 0}
            onClick={() => onPick("batal")}
          >
            {labelOf("batal", "Batalkan")}
          </Button>
        ) : null}

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
      </div>
    </section>
  );
};
