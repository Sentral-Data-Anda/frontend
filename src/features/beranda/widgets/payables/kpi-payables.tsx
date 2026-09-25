"use client";

import { CreditCard } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { usePayables } from "./data";

export const KpiPayables = () => {
  const state = usePayables();
  const payable = state.rows.filter((row) => row.isPayable);
  const total = payable.reduce((sum, row) => sum + (row.amount ?? 0), 0);

  return (
    <KpiCell
      label="Perlu dibayar"
      icon={CreditCard}
      tone="warning"
      value={`${payable.length} dok.`}
      hint={payable.length ? formatRupiahCompact(total) : "semua lunas"}
      isLoading={state.isPending}
      isError={state.error !== null}
    />
  );
};
