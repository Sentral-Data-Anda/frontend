"use client";

import { Button, Textarea } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { FormField } from "@/components/common/form";

import { POSTED_NOTE, VOID_REASON_MAX } from "../model";
import type { Persembahan } from "../types";

interface PropTypes {
  row: Persembahan;
  reason: string;
  error?: string;
  isBusy: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
}

/**
 * Alasan diketik di halaman baca, bukan di dalam dialog: `FormConfirmDialog`
 * sengaja tidak punya slot isi, dan tautan di dalam modal membatalkan
 * konfirmasi tanpa umpan balik.
 */
export const VoidPanel = (props: PropTypes) => {
  const { row, reason, error, isBusy, onReasonChange, onConfirm } = props;

  const isPosted = row.journal !== null;

  return (
    <Panel label="Batalkan persembahan" className="space-y-3 px-gutter py-4">
      <p className="text-body">
        Persembahan tidak bisa diubah. Yang salah dibatalkan dengan alasan, lalu
        dicatat ulang.
        {isPosted ? ` ${POSTED_NOTE}` : ""}
      </p>

      <FormField htmlFor="voidReason" label="Alasan pembatalan" error={error}>
        <Textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          maxLength={VOID_REASON_MAX}
          rows={3}
          disabled={isBusy}
          placeholder="mis. Amplop terhitung dua kali saat penghitungan kolekte."
        />
      </FormField>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="destructive"
          disabled={isBusy}
          onClick={onConfirm}
        >
          {isBusy ? "Membatalkan…" : "Batalkan persembahan"}
        </Button>
      </div>
    </Panel>
  );
};
