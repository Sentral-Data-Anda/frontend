"use client";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { DUMMY_CASH_ACCOUNTS, DUMMY_CASH_RUNWAY_MONTHS } from "../../fixtures";

export const KpiCashBalance = () => {
  const total = DUMMY_CASH_ACCOUNTS.reduce((sum, row) => sum + row.amount, 0);

  return (
    <KpiCell
      label="Saldo kas & bank"
      value={formatRupiahCompact(total)}
      hint={`≈ ${DUMMY_CASH_RUNWAY_MONTHS.toLocaleString("id-ID")} bln pengeluaran`}
      isDummy
    />
  );
};
