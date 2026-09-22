"use client";

import { DashboardCard } from "@/components/common/dashboard-card";
import { MENU, menuHref } from "@/config/menu";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

import { useMonthlyFlow } from "./api";
import { toDateKey } from "./time";

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

/** Batas atas sumbu: kelipatan "rapi" (1/2/5 × 10ⁿ) di atas nilai terbesar. */
export const niceCeiling = (value: number): number => {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => m * power >= value) ?? 10;
  return step * power;
};

const GRID = [1, 0.5, 0];

/**
 * Masuk vs keluar per bulan, tahun berjalan (Jan–Des). SVG sendiri, tanpa
 * library (dashboard-desktop.md §5.4): batang saja di SVG yang meregang
 * (`preserveAspectRatio="none"`), teks sumbu di HTML supaya tetap 10px di
 * lebar berapa pun. Masuk = `success`, keluar = `primary` (keduanya ≥ 3:1
 * terhadap kartu putih), dibedakan juga oleh urutan (masuk kiri) dan legenda.
 *
 * Alternatif teks: tabel `sr-only` bulan × masuk × keluar; SVG-nya sendiri
 * `aria-hidden`.
 */
export function IncomeExpenseChart() {
  const today = toDateKey(new Date());
  const year = today.slice(0, 4);
  const flow = useMonthlyFlow(today);
  const max = niceCeiling(
    Math.max(0, ...flow.months.flatMap((m) => [m.income, m.expense])),
  );

  // 12 slot × 10 unit; dua batang 3 unit + celah 1, sisa 3 unit jarak antar-bulan.
  const bars = flow.months.flatMap((m, i) => [
    { key: `${m.month}-in`, x: i * 10 + 1.5, value: m.income, isIncome: true },
    {
      key: `${m.month}-out`,
      x: i * 10 + 5.5,
      value: m.expense,
      isIncome: false,
    },
  ]);

  return (
    <DashboardCard
      title={`Masuk vs keluar · ${year}`}
      actionLabel="Laporan"
      actionHref={menuHref(MENU.KEUANGAN, MENU.LAPORAN_KEUANGAN)}
      query={flow}
      minHeight="min-h-52"
    >
      <div className="text-muted-foreground mb-2 flex gap-4 text-caption">
        <span className="flex items-center gap-1.5">
          <span className="bg-success size-2.5 rounded-xs" aria-hidden />
          Masuk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-primary size-2.5 rounded-xs" aria-hidden />
          Keluar
        </span>
      </div>

      <div className="flex gap-2">
        <div
          aria-hidden
          className="text-muted-foreground flex h-40 w-14 shrink-0 flex-col justify-between text-right text-caption tabular-nums"
        >
          {GRID.map((ratio) => (
            <span key={ratio} className="-my-1.5 leading-none">
              {ratio === 0 ? "0" : formatRupiahCompact(max * ratio)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <svg
            aria-hidden
            viewBox="0 0 120 100"
            preserveAspectRatio="none"
            className="block h-40 w-full"
          >
            {GRID.map((ratio) => (
              <line
                key={ratio}
                x1="0"
                x2="120"
                y1={100 - ratio * 100}
                y2={100 - ratio * 100}
                className="stroke-border"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {bars.map((bar) => {
              const height = (bar.value / max) * 100;
              return (
                <rect
                  key={bar.key}
                  x={bar.x}
                  y={100 - height}
                  width="3"
                  height={height}
                  className={bar.isIncome ? "fill-success" : "fill-primary"}
                />
              );
            })}
          </svg>

          <div
            aria-hidden
            className="text-muted-foreground mt-1 grid grid-cols-12 text-center text-caption"
          >
            {MONTH_LABEL.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
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
          {flow.months.map((m, i) => (
            <tr key={m.month}>
              <th scope="row">{MONTH_LABEL[i]}</th>
              <td>{formatRupiah(m.income)}</td>
              <td>{formatRupiah(m.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardCard>
  );
}
