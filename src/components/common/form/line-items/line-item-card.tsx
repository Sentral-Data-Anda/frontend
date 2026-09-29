"use client";

import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/common/control";

import {
  lineItemMessageId,
  type LineItemMessage,
} from "./use-line-item-errors";

interface PropTypes {
  index: number;
  title: ReactNode;
  meta?: ReactNode;
  removeLabel: string;
  isRemoveDisabled?: boolean;
  onRemove?: (index: number) => void;
  messages: readonly LineItemMessage[];
  children: ReactNode;
}

export const LineItemCard = (props: PropTypes) => {
  const {
    index,
    title,
    meta,
    removeLabel,
    isRemoveDisabled,
    onRemove,
    messages,
    children,
  } = props;

  const isInvalid = messages.length > 0;

  return (
    <li
      data-invalid={isInvalid || undefined}
      className="border-border bg-card data-invalid:border-destructive/50 rounded-control border p-3"
    >
      <div className="flex min-h-control items-center gap-3">
        <span
          aria-hidden
          className="text-muted-foreground w-5 shrink-0 text-body tabular-nums"
        >
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-body font-medium wrap-break-word">{title}</p>
          {meta ? (
            <p className="text-muted-foreground text-caption wrap-break-word tabular-nums">
              {meta}
            </p>
          ) : null}
        </div>

        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={removeLabel}
            disabled={isRemoveDisabled}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive -mr-1.5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
            onClick={() => onRemove(index)}
          >
            <Trash2 aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3 sm:pl-8">
        {children}
      </div>

      {isInvalid ? (
        <div className="mt-2 space-y-0.5 sm:pl-8">
          {messages.map(({ id, message }) => (
            <p
              key={id}
              id={lineItemMessageId(id)}
              className="text-destructive text-body"
            >
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </li>
  );
};
