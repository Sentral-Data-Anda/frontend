"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

import { clashSummary, formatLoanDate, type PreviewRow } from "../model";

interface PropTypes {
  index: number;
  row: PreviewRow;
  error: string | undefined;
  isDisabled: boolean;
  onToggle: (date: string, isTicked: boolean) => void;
}

export const RepeatRow = memo(function RepeatRow(props: PropTypes) {
  const { index, row, error, isDisabled, onToggle } = props;

  const id = `repeat-row-${index}`;
  const isClashing = row.clashes.length > 0;
  const status = error ?? clashSummary(row.clashes);

  return (
    <li
      className={cn(
        "border-border grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-1 border-t px-2 py-1.5 first:border-t-0",
        error && "bg-destructive/10",
        !row.isTicked && !error && "bg-muted/40",
      )}
    >
      <span className="flex size-control items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={row.isTicked}
          disabled={isDisabled || isClashing}
          onChange={(event) => onToggle(row.date, event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-status`}
          className="accent-primary size-4 cursor-pointer disabled:cursor-not-allowed"
        />
      </span>

      <label
        htmlFor={id}
        className={cn(
          "flex min-w-0 cursor-pointer flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1",
          (isDisabled || isClashing) && "cursor-not-allowed",
          !row.isTicked && !error && "opacity-70",
        )}
      >
        <span className="w-28 shrink-0 text-body font-medium tabular-nums">
          {formatLoanDate(row.date)}
        </span>
        <span
          id={`${id}-status`}
          className={cn(
            "min-w-0 text-body",
            error || isClashing ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status}
        </span>
      </label>
    </li>
  );
});
