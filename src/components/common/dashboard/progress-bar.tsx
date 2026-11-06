import { TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

interface PropTypes {
  label: string;
  value: number;
  meta?: string;
  title?: string;
  alertAbove?: number;
  /**
   * Barisnya mengukur field yang wajib diisi.
   *
   * Ditandai asterisk merah seperti di label form, supaya tanda yang sama
   * berarti hal yang sama di dua tempat. Asteriknya `aria-hidden` dan
   * keterangannya dibaca lewat teks sr-only; pembaca layar tidak bisa
   * diandalkan mengucapkan "*" sebagai "wajib".
   */
  isRequired?: boolean;
}

export const ProgressBar = (props: PropTypes) => {
  const { label, value, meta, title, alertAbove, isRequired } = props;

  const percent = Math.max(0, Math.min(100, Math.round(value)));
  const isAlert = alertAbove !== undefined && value > alertAbove;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span
          className="flex min-w-0 items-center gap-1.5 text-body font-medium"
          title={title ?? label}
        >
          {isAlert ? (
            <TriangleAlert
              className="size-3 shrink-0"
              aria-label={`di atas ${alertAbove}%`}
            />
          ) : null}
          <span className="truncate">{label}</span>
          {isRequired ? (
            <>
              <span aria-hidden className="text-destructive shrink-0">
                *
              </span>
              <span className="sr-only">(wajib)</span>
            </>
          ) : null}
        </span>
        {meta ? (
          <span className="text-muted-foreground shrink-0 text-caption tabular-nums">
            {meta}
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-muted h-1.5 overflow-hidden rounded-full"
      >
        <div
          className={cn("bg-primary h-full rounded-full")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
