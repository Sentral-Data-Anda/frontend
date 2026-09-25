import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react";
import { Children, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function KpiStrip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const cells = Children.toArray(children);
  const count = cells.length;
  const isFive = count === 5;

  return (
    <div className="@container">
      <section
        aria-label={label}
        style={{ "--kpi-cols": count } as React.CSSProperties}
        className={cn(
          "max-w-[calc(var(--kpi-cols)*28rem)]",
          "border-hairline bg-hairline grid grid-cols-2 gap-px overflow-hidden rounded-lg border",
          isFive
            ? "@min-[40rem]:grid-cols-6"
            : "@min-[40rem]:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
          "@min-[55rem]:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
        )}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            className={cn(
              "bg-card min-w-0",
              index === count - 1 && count % 2 === 1 && "col-span-2",
              isFive
                ? index < 3
                  ? "@min-[40rem]:col-span-2"
                  : "@min-[40rem]:col-span-3"
                : "@min-[40rem]:col-span-1",
              "@min-[55rem]:col-span-1",
            )}
          >
            {cell}
          </div>
        ))}
      </section>
    </div>
  );
}

export type KpiDelta = {
  percent: number;
  label: string;
  isUpGood: boolean;
};

const percentFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function KpiCell({
  label,
  value,
  hint,
  delta,
  isDummy = false,
  isLoading = false,
  isError = false,
}: {
  label: string;
  value?: ReactNode;
  hint?: ReactNode;
  delta?: KpiDelta | null;
  isDummy?: boolean;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const isUp = (delta?.percent ?? 0) >= 0;
  const isGood = delta ? isUp === delta.isUpGood : false;

  return (
    <div className="px-3.5 py-3.5 lg:px-6">
      <p className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-caption font-medium tracking-wide uppercase">
        <span className="truncate">{label}</span>
        {isDummy ? <Badge variant="sample">contoh data</Badge> : null}
      </p>
      {isLoading ? (
        <span className="bg-muted mt-2 block h-5 w-24 animate-pulse rounded-control lg:h-7" />
      ) : isError ? (
        <p className="text-muted-foreground mt-1.5 flex min-h-5 items-center gap-1.5 truncate text-body lg:min-h-7">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          Gagal dimuat
        </p>
      ) : (
        <p className="mt-1.5 truncate text-kpi font-semibold tracking-tight tabular-nums">
          {value ?? "—"}
        </p>
      )}
      {isError ? null : delta ? (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-caption tabular-nums",
            isGood ? "text-success" : "text-destructive",
          )}
        >
          {isUp ? (
            <ArrowUp className="size-2.5" aria-label="naik" />
          ) : (
            <ArrowDown className="size-2.5" aria-label="turun" />
          )}
          {percentFormat.format(Math.abs(delta.percent))}% {delta.label}
        </p>
      ) : hint ? (
        <p className="text-muted-foreground mt-1 truncate text-caption tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
