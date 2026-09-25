"use client";

import { ArrowDownToLine } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { useMonthFlow } from "./data";

export const KpiIncome = () => {
  const { query, previous, deltaOf } = useMonthFlow();

  return (
    <KpiCell
      label="Masuk bulan ini"
      icon={ArrowDownToLine}
      tone="success"
      value={query.data ? formatRupiahCompact(query.data.income) : undefined}
      hint="tanpa pembanding tahun lalu"
      delta={deltaOf(query.data?.income, previous?.income ?? 0, true)}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
