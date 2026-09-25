"use client";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { useMonthFlow } from "./data";

export const KpiExpense = () => {
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
};
