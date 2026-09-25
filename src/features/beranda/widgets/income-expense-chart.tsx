"use client";

import { DashboardCard } from "@/components/common/dashboard";
import { MENU, menuHref } from "@/config/menu";
import { formatRupiah } from "@/lib/format";

import { useMonthlyFlow } from "../api";
import { useNow } from "../hooks/use-now";
import { toDateKey } from "../model";

const MONTH_LABEL = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const niceCeiling = (value: number): number => {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
};

function Legend() {
  return (
    <span className="text-muted-foreground flex items-center gap-3 text-caption">
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-income size-1.5 rounded-xs" aria-hidden />
        Masuk
      </span>
      <span className="flex items-center gap-1.5">
        <span className="bg-chart-expense size-1.5 rounded-xs" aria-hidden />
        Keluar
      </span>
    </span>
  );
}

export function IncomeExpenseChart() {
  const today = toDateKey(new Date());
  const now = useNow();
  const year = now ? toDateKey(now).slice(0, 4) : "";
  const flow = useMonthlyFlow(today);
  const max = niceCeiling(
    Math.max(0, ...flow.months.flatMap((m) => [m.income, m.expense])),
  );

  return (
    <DashboardCard
      title="Masuk vs keluar · 12 bulan"
      trailing={<Legend />}
      actionLabel="Laporan"
      actionHref={menuHref(MENU.KEUANGAN, MENU.LAPORAN_KEUANGAN)}
      query={flow}
      minHeight="min-h-52"
    >
      <div aria-hidden className="flex h-44 items-end gap-1.5">
        {MONTH_LABEL.map((label, index) => {
          const month = flow.months[index];
          return (
            <div key={label} className="flex h-full min-w-0 flex-1 flex-col">
              <div className="flex flex-1 items-end justify-center gap-1">
                {(
                  [
                    ["income", "bg-chart-income", month?.income ?? 0],
                    ["expense", "bg-chart-expense", month?.expense ?? 0],
                  ] as const
                ).map(([key, color, value]) => (
                  <span
                    key={key}
                    title={`${label}: ${key === "income" ? "masuk" : "keluar"} ${formatRupiah(value)}`}
                    className={`${color} w-full max-w-3 min-w-1.5 rounded-t-sm`}
                    style={{ height: `${(value / max) * 100}%` }}
                  />
                ))}
              </div>
              <span className="text-muted-foreground mt-2 text-center text-caption">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>Masuk dan keluar per bulan, {year}</caption>
        <thead>
          <tr>
            <th scope="col">Bulan</th>
            <th scope="col">Masuk</th>
            <th scope="col">Keluar</th>
          </tr>
        </thead>
        <tbody>
          {flow.months.map((m, index) => (
            <tr key={m.month}>
              <th scope="row">{MONTH_LABEL[index]}</th>
              <td>{formatRupiah(m.income)}</td>
              <td>{formatRupiah(m.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardCard>
  );
}
