"use client";

import { KpiCell } from "@/components/common/kpi-strip";
import { formatRupiahCompact } from "@/lib/format";

import { useNeraca, useSurplusDefisit } from "./api";
import { toDateKey } from "./time";

/** Hari ini, awal bulan, awal tahun (WIB). */
const useToday = () => {
  // ponytail: dihitung sekali per render (WIB).
  const today = toDateKey(new Date());
  return {
    today,
    monthStart: `${today.slice(0, 7)}-01`,
    yearStart: `${today.slice(0, 4)}-01-01`,
  };
};

const signed = (value: number) =>
  `${value > 0 ? "+" : ""}${formatRupiahCompact(value)}`;

/**
 * Total aset per hari ini (`neraca.totals.assets`). Bukan "saldo kas":
 * akun di be-sada tidak punya penanda kas/bank, dan akun mana yang dihitung
 * "kas" belum diputuskan bendahara (BA #2). Label mengatakan apa adanya.
 */
export function KpiTotalAssets() {
  const { today } = useToday();
  const query = useNeraca(today);

  return (
    <KpiCell
      label="Total aset"
      value={query.data ? formatRupiahCompact(query.data.assets) : undefined}
      hint="Per hari ini"
      isLoading={query.isPending}
    />
  );
}

function useMonthFlow() {
  const { today, monthStart } = useToday();
  return useSurplusDefisit(monthStart, today);
}

export function KpiIncome() {
  const query = useMonthFlow();

  return (
    <KpiCell
      label="Masuk"
      value={query.data ? formatRupiahCompact(query.data.income) : undefined}
      hint="Bulan ini"
      isLoading={query.isPending}
    />
  );
}

export function KpiExpense() {
  const query = useMonthFlow();

  return (
    <KpiCell
      label="Keluar"
      value={query.data ? formatRupiahCompact(query.data.expense) : undefined}
      hint="Bulan ini"
      isLoading={query.isPending}
    />
  );
}

export function KpiSurplusMonth() {
  const query = useMonthFlow();

  return (
    <KpiCell
      label="Surplus / defisit"
      value={query.data ? signed(query.data.surplus) : undefined}
      hint="Bulan ini"
      isLoading={query.isPending}
    />
  );
}

/** Ringkasan untuk pemegang laporan tanpa meja kas (mis. majelis). */
export function KpiSurplusYear() {
  const { today, yearStart } = useToday();
  const query = useSurplusDefisit(yearStart, today);

  return (
    <KpiCell
      label="Surplus / defisit"
      value={query.data ? signed(query.data.surplus) : undefined}
      hint="Tahun berjalan"
      isLoading={query.isPending}
    />
  );
}
