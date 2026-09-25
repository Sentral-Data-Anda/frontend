"use client";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { usePayables } from "./data";

export function KpiPayables() {
  const state = usePayables();
  const payable = state.rows.filter((row) => row.isPayable);
  const total = payable.reduce((sum, row) => sum + (row.amount ?? 0), 0);

  return (
    <KpiCell
      label="Perlu dibayar"
      value={`${payable.length} dok.`}
      hint={payable.length ? formatRupiahCompact(total) : "Semua lunas"}
      isLoading={state.isPending}
      isError={state.error !== null}
    />
  );
}
