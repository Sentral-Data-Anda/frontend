"use client";

import { Button, Textarea } from "@/components/common/control";
import { FormField } from "@/components/common/form";

import { CANCEL_REASON_REQUIRED } from "../model";
import type { Transfer, TransferAction } from "../types";

const LEAD = {
  DRAFT:
    "Setoran ini belum masuk pembukuan. Setor bila uangnya benar sudah berpindah.",
  PAID: "Setoran ini sudah masuk pembukuan. Membatalkan menulis entri pembalik bertanggal hari ini.",
} as const;

const PENDING_LABEL: Record<TransferAction, string> = {
  setor: "Menyetor…",
  batal: "Membatalkan…",
};

interface PropTypes {
  transfer: Transfer;
  isCanCreate: boolean;
  isCanDelete: boolean;
  reason: string;
  isReasonMissing: boolean;
  pendingAction: TransferAction | null;
  onReasonChange: (reason: string) => void;
  onPick: (action: TransferAction) => void;
}

export const TransferActions = (props: PropTypes) => {
  const {
    transfer,
    isCanCreate,
    isCanDelete,
    reason,
    isReasonMissing,
    pendingAction,
    onReasonChange,
    onPick,
  } = props;

  const { status } = transfer;
  const isBusy = pendingAction !== null;
  const isPosting = status === "DRAFT" && isCanCreate;
  const isCancelling = status === "PAID" && isCanDelete;

  if (!isPosting && !isCancelling) return null;

  return (
    <section aria-label="Aksi setoran" className="space-y-3">
      <p className="text-muted-foreground text-body">
        {status === "DRAFT" ? LEAD.DRAFT : LEAD.PAID}
      </p>

      {isCancelling ? (
        <div className="max-w-prose">
          <FormField
            htmlFor="cancel-reason"
            label="Alasan pembatalan"
            error={isReasonMissing ? CANCEL_REASON_REQUIRED : undefined}
            hint="Tercatat bersama entri pembaliknya."
          >
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              disabled={isBusy}
              maxLength={250}
              rows={2}
              placeholder="Mis. uangnya ternyata belum disetor ke bank"
            />
          </FormField>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {isCancelling ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isBusy}
            onClick={() => onPick("batal")}
          >
            {pendingAction === "batal" ? PENDING_LABEL.batal : "Batalkan"}
          </Button>
        ) : null}

        {isPosting ? (
          <Button
            type="button"
            disabled={isBusy}
            onClick={() => onPick("setor")}
          >
            {pendingAction === "setor" ? PENDING_LABEL.setor : "Setor"}
          </Button>
        ) : null}
      </div>
    </section>
  );
};
