import {
  ArrowDown,
  ArrowUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Children, type ReactNode } from "react";

import { Badge } from "@/components/ui";
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
          "grid grid-cols-2 gap-4",
          isFive
            ? "@min-[36rem]:grid-cols-6"
            : "@min-[36rem]:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
          "@min-[55rem]:grid-cols-[repeat(var(--kpi-cols),minmax(0,28rem))]",
        )}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            className={cn(
              "bg-card border-hairline @container/kpi min-w-0 rounded-lg border",
              index === count - 1 && count % 2 === 1 && "col-span-2",
              isFive
                ? index < 3
                  ? "@min-[36rem]:col-span-2"
                  : "@min-[36rem]:col-span-3"
                : "@min-[36rem]:col-span-1",
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

export type KpiTone = "primary" | "secondary" | "success" | "warning";

const TONE: Record<KpiTone, string> = {
  primary: "bg-primary-100 text-primary-900",
  secondary: "bg-secondary-100 text-secondary-900",
  success: "bg-success-100 text-success-900",
  warning: "bg-warning-50 text-warning-900",
};

const percentFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function KpiCell({
  label,
  icon: Icon,
  tone = "primary",
  value,
  hint,
  delta,
  isDummy = false,
  isLoading = false,
  isError = false,
}: {
  label: string;
  icon: LucideIcon;
  tone?: KpiTone;
  value?: ReactNode;
  hint: ReactNode;
  delta?: KpiDelta | null;
  isDummy?: boolean;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const isUp = (delta?.percent ?? 0) >= 0;
  const isGood = delta ? isUp === delta.isUpGood : false;
  const Arrow = isUp ? ArrowUp : ArrowDown;

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 p-3.5 [grid-template-areas:'icon_label_label'_'value_value_value'_'hint_hint_badge'] lg:px-5 lg:py-4 @min-[13rem]/kpi:[grid-template-areas:'icon_label_badge'_'value_value_value'_'hint_hint_hint']">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-control [grid-area:icon] lg:size-9",
          TONE[tone],
        )}
      >
        <Icon className="size-4 lg:size-[1.125rem]" aria-hidden />
      </span>

      <p
        className="text-muted-foreground line-clamp-2 text-body leading-tight font-medium [grid-area:label]"
        title={label}
      >
        {label}
      </p>

      {isDummy ? (
        <Badge
          variant="sample"
          className="mt-1 justify-self-end [grid-area:badge] @min-[13rem]/kpi:mt-0"
        >
          contoh data
        </Badge>
      ) : null}

      <div className="mt-2 flex min-h-5 items-center [grid-area:value] lg:mt-3 lg:min-h-7">
        {isLoading ? (
          <span className="bg-muted block h-5 w-20 animate-pulse rounded-control lg:h-7" />
        ) : isError ? (
          <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-body">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">Gagal dimuat</span>
          </p>
        ) : (
          <p className="truncate text-kpi font-semibold tracking-tight tabular-nums">
            {value ?? "—"}
          </p>
        )}
      </div>

      <div className="mt-1 flex min-h-4 items-center [grid-area:hint]">
        {isLoading ? (
          <span className="bg-muted block h-3 w-16 animate-pulse rounded-control" />
        ) : delta && !isError ? (
          <p className="text-foreground flex min-w-0 items-center gap-1 text-caption tabular-nums">
            <Arrow
              className={cn(
                "size-3 shrink-0",
                isGood ? "text-success" : "text-destructive",
              )}
              aria-label={isUp ? "naik" : "turun"}
            />
            <span className="truncate">
              {percentFormat.format(Math.abs(delta.percent))}% {delta.label}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground truncate text-caption tabular-nums">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
