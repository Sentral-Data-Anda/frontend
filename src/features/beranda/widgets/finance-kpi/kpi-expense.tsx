"use client";

import { ArrowUpFromLine } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { useMonthFlow } from "./data";

export const KpiExpense = () => {
  const { query, previous, deltaOf } = useMonthFlow();

  return (
    <KpiCell
      label="Keluar bulan ini"
      icon={ArrowUpFromLine}
      tone="warning"
      value={query.data ? formatRupiahCompact(query.data.expense) : undefined}
      hint="tanpa pembanding tahun lalu"
      delta={deltaOf(query.data?.expense, previous?.expense ?? 0, false)}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
