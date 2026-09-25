"use client";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { useMonthFlow } from "./data";

export const KpiIncome = () => {
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
};
