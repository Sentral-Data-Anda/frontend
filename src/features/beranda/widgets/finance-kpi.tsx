"use client";

import { KpiCell, type KpiDelta } from "@/components/common/kpi-strip";
import { formatRupiahCompact } from "@/lib/format";

import { useSurplusDefisit } from "../api";
import { DUMMY_CASH_ACCOUNTS, DUMMY_CASH_RUNWAY_MONTHS } from "../fixtures";
import { monthOf, toDateKey } from "../model";

const MONTH_SHORT = [
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

/** Rentang bulan berjalan dan rentang yang sama tahun lalu (WIB). */
const useRanges = () => {
  // ponytail: dihitung sekali per render.
  const today = toDateKey(new Date());
  const [year, month, day] = today.split("-");
  const lastYear = String(Number(year) - 1);

  return {
    today,
    year,
    monthStart: `${year}-${month}-01`,
    yearStart: `${year}-01-01`,
    lastYearFrom: `${lastYear}-${month}-01`,
    lastYearTo: `${lastYear}-${month}-${day}`,
    monthLabel: `${MONTH_SHORT[Number(month) - 1]} ${lastYear}`,
    untilLabel: `Jan–${MONTH_SHORT[monthOf(new Date()) - 1]} ${year}`,
  };
};

/**
 * Masuk/keluar bulan berjalan + pembanding rentang yang sama tahun lalu.
 * Delta disembunyikan di tahun pertama (tahun lalu tidak punya angka sama
 * sekali) — dashboard-desktop.md §10.3.
 */
function useMonthFlow() {
  const ranges = useRanges();
  const thisYear = useSurplusDefisit(ranges.monthStart, ranges.today);
  const lastYear = useSurplusDefisit(ranges.lastYearFrom, ranges.lastYearTo);
  const previous = lastYear.data;
  const hasComparison =
    previous !== undefined && previous.income + previous.expense > 0;

  const deltaOf = (
    now: number | undefined,
    before: number,
    isUpGood: boolean,
  ): KpiDelta | null => {
    if (!hasComparison || now === undefined || before <= 0) return null;
    const percent = ((now - before) / before) * 100;

    // Selisih yang membulat ke 0% bukan kabar apa-apa — panah dan warnanya
    // justru menyesatkan.
    return Math.round(Math.abs(percent)) === 0
      ? null
      : { percent, label: `vs ${ranges.monthLabel}`, isUpGood };
  };

  return { ranges, query: thisYear, previous, deltaOf };
}

export function KpiIncome() {
  const { query, previous, deltaOf } = useMonthFlow();

  return (
    <KpiCell
      label="Masuk · bulan ini"
      value={query.data ? formatRupiahCompact(query.data.income) : undefined}
      delta={deltaOf(query.data?.income, previous?.income ?? 0, true)}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}

export function KpiExpense() {
  const { query, previous, deltaOf } = useMonthFlow();

  return (
    <KpiCell
      label="Keluar · bulan ini"
      value={query.data ? formatRupiahCompact(query.data.expense) : undefined}
      delta={deltaOf(query.data?.expense, previous?.expense ?? 0, false)}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}

/** Surplus/defisit tahun berjalan, dengan tanda + / − eksplisit. */
export function KpiSurplusYear() {
  const ranges = useRanges();
  const query = useSurplusDefisit(ranges.yearStart, ranges.today);
  const surplus = query.data?.surplus;

  return (
    <KpiCell
      label="Surplus · tahun berjalan"
      value={
        surplus === undefined
          ? undefined
          : `${surplus > 0 ? "+" : ""}${formatRupiahCompact(surplus)}`
      }
      hint={ranges.untilLabel}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
}

/**
 * Saldo kas & bank — DUMMY: `Account` be-sada belum punya penanda kas/bank,
 * dan akun mana yang dihitung "kas" belum diputuskan (§10.1 #6, U1).
 */
export function KpiCashBalance() {
  const total = DUMMY_CASH_ACCOUNTS.reduce((sum, row) => sum + row.amount, 0);

  return (
    <KpiCell
      label="Saldo kas & bank"
      value={formatRupiahCompact(total)}
      hint={`≈ ${DUMMY_CASH_RUNWAY_MONTHS.toLocaleString("id-ID")} bln pengeluaran`}
      isDummy
    />
  );
}
