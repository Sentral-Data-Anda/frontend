import {
  ArrowDown,
  ArrowUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Children, type ReactNode } from "react";

import { Panel } from "@/components/common/display";
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
  // Batas 28rem menjaga strip dua sel tidak jadi dua kartu selebar layar (§10.12).
  // Mulai tiga sel batas itu justru menyisakan lubang di kanan strip, sementara
  // baris kartu di bawahnya tetap selebar penuh.
  const isCapped = count <= 2;

  return (
    <div className="@container/strip">
      <section
        aria-label={label}
        style={{ "--kpi-cols": count } as React.CSSProperties}
        className={cn(
          "grid grid-cols-2 gap-4",
          isFive
            ? "@min-[36rem]/strip:grid-cols-6"
            : "@min-[36rem]/strip:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
          isCapped
            ? "@min-[55rem]/strip:grid-cols-[repeat(var(--kpi-cols),minmax(0,28rem))]"
            : "@min-[55rem]/strip:grid-cols-[repeat(var(--kpi-cols),minmax(0,1fr))]",
        )}
      >
        {cells.map((cell, index) => (
          <Panel
            key={index}
            className={cn(
              "@container/kpi",
              index === count - 1 && count % 2 === 1 && "col-span-2",
              isFive
                ? index < 3
                  ? "@min-[36rem]/strip:col-span-2"
                  : index === 3
                    ? "@min-[36rem]/strip:col-[2/span_2]"
                    : "@min-[36rem]/strip:col-span-2"
                : "@min-[36rem]/strip:col-span-1",
              "@min-[55rem]/strip:col-span-1",
            )}
          >
            {cell}
          </Panel>
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

  // lg: mengikuti skala tipografi (text-kpi, text-title) yang berganti di 64rem.
  return (
    <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 p-3.5 [grid-template-areas:'icon_label_label'_'value_value_value'_'hint_hint_hint'] lg:px-5 lg:py-4 @max-[36rem]/strip:@min-[19rem]/kpi:[grid-template-areas:'icon_label_value'_'icon_hint_value']">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-control [grid-area:icon] lg:size-9",
          TONE[tone],
        )}
      >
        <Icon className="size-4 lg:size-[1.125rem]" aria-hidden />
      </span>

      {isDummy ? (
        <Badge variant="sample" className="bg-card absolute -top-2.5 right-3">
          contoh data
        </Badge>
      ) : null}

      <p
        className="text-muted-foreground line-clamp-2 text-body leading-tight font-medium [grid-area:label]"
        title={label}
      >
        {label}
      </p>

      <div className="mt-2 flex min-h-5 min-w-0 items-center [grid-area:value] lg:mt-3 lg:min-h-7 @max-[36rem]/strip:@min-[19rem]/kpi:mt-0 @max-[36rem]/strip:@min-[19rem]/kpi:justify-self-end">
        {isLoading ? (
          <span className="bg-skeleton block h-5 w-20 animate-pulse rounded-control lg:h-7" />
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

      <div className="mt-1 flex min-h-4 min-w-0 items-center [grid-area:hint] @max-[36rem]/strip:@min-[19rem]/kpi:mt-0.5">
        {isLoading ? (
          <span className="bg-skeleton block h-3 w-16 animate-pulse rounded-control" />
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
