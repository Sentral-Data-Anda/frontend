"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/common/control";

interface PropTypes {
  label: string;
  count: number;
  addLabel?: string;
  isAddDisabled?: boolean;
  onAdd?: () => void;
  empty: ReactNode;
  summary?: ReactNode;
  error?: string;
  errorId?: string;
  children: ReactNode;
}

export const LineItemList = (props: PropTypes) => {
  const {
    label,
    count,
    addLabel = "Tambah barang",
    isAddDisabled,
    onAdd,
    empty,
    summary,
    error,
    errorId,
    children,
  } = props;

  const isEmpty = count === 0;

  return (
    <div className="space-y-3">
      {isEmpty ? (
        <div className="border-border text-muted-foreground rounded-control border border-dashed px-4 py-6 text-center text-body">
          {empty}
        </div>
      ) : (
        <ol aria-label={label} className="space-y-2">
          {children}
        </ol>
      )}

      {error ? (
        <p id={errorId} className="text-destructive text-body">
          {error}
        </p>
      ) : null}

      {onAdd || summary ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {onAdd ? (
            <Button
              type="button"
              variant="outline"
              disabled={isAddDisabled}
              className="cursor-pointer disabled:cursor-not-allowed"
              onClick={onAdd}
            >
              <Plus aria-hidden />
              {addLabel}
            </Button>
          ) : (
            <span />
          )}

          {summary ? (
            <p
              aria-live="polite"
              className="ml-auto text-right text-body font-medium tabular-nums"
            >
              {summary}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
