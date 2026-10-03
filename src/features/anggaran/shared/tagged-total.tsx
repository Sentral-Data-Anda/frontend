"use client";

import type { ReactNode } from "react";

import { formatRupiah } from "@/lib/format";
import { sumAmounts } from "@/lib/number";

export type TaggedPart = {
  key: string;
  label: string;
  amount: string;
  href?: string;
  hint?: string;
};

interface PropTypes {
  label: string;
  parts: readonly TaggedPart[];
  untaggedLabel: string;
  untagged: string;
  untaggedHint: string;
  renderPart?: (part: TaggedPart) => ReactNode;
}

const ROW = "flex items-baseline justify-between gap-3 py-1.5 text-body";

const AMOUNT = "shrink-0 tabular-nums";

export const TaggedTotal = (props: PropTypes) => {
  const { label, parts, untaggedLabel, untagged, untaggedHint, renderPart } =
    props;

  const total = sumAmounts([...parts.map((part) => part.amount), untagged]);

  return (
    <div aria-label={label} className="divide-border divide-y">
      {parts.map((part) => (
        <div key={part.key} className={ROW}>
          {renderPart ? (
            renderPart(part)
          ) : (
            <span className="min-w-0 truncate">{part.label}</span>
          )}
          <span className={AMOUNT}>{formatRupiah(Number(part.amount))}</span>
        </div>
      ))}

      <div className={ROW} data-untagged>
        <span className="min-w-0">
          <span className="block truncate">{untaggedLabel}</span>
          <span className="text-muted-foreground block text-caption">
            {untaggedHint}
          </span>
        </span>
        <span className={AMOUNT}>{formatRupiah(Number(untagged))}</span>
      </div>

      <div className={`${ROW} font-medium`}>
        <span className="min-w-0 truncate">Total</span>
        <span className={AMOUNT}>{formatRupiah(Number(total))}</span>
      </div>
    </div>
  );
};
