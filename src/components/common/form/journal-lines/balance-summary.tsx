"use client";

import { Check, TriangleAlert } from "lucide-react";

import { formatRupiah } from "@/lib/format";
import type { BalanceSide } from "@/lib/number";
import { cn } from "@/lib/utils";

interface PropTypes {
  debit: string;
  credit: string;
  difference: string;
  shortSide: BalanceSide | null;
  isBalanced: boolean;
}

const FIGURE = "text-muted-foreground font-normal";

const SHORT_LABEL: Record<BalanceSide, string> = {
  debit: "Debit kurang",
  credit: "Kredit kurang",
};

export const BalanceSummary = (props: PropTypes) => {
  const { debit, credit, difference, shortSide, isBalanced } = props;

  const isEmpty = debit === "0" && credit === "0";

  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
      {isEmpty ? (
        <span className={FIGURE}>Belum ada nominal</span>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            isBalanced ? "text-success" : "text-warning-foreground",
          )}
        >
          {isBalanced ? (
            <Check aria-hidden className="size-4 shrink-0" strokeWidth={3} />
          ) : (
            <TriangleAlert aria-hidden className="size-4 shrink-0" />
          )}
          {isBalanced || shortSide === null
            ? "Seimbang"
            : `${SHORT_LABEL[shortSide]} ${formatRupiah(Number(difference))}`}
        </span>
      )}

      <span className={FIGURE}>Debit {formatRupiah(Number(debit))}</span>
      <span className={FIGURE}>Kredit {formatRupiah(Number(credit))}</span>
    </span>
  );
};
