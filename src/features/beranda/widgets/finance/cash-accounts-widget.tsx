"use client";

import { DashboardCard } from "@/components/common/dashboard";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

import { DUMMY_CASH_ACCOUNTS } from "../../fixtures";

export function CashAccountsWidget() {
  const total = DUMMY_CASH_ACCOUNTS.reduce((sum, row) => sum + row.amount, 0);

  return (
    <DashboardCard title="Saldo per rekening" isDummy>
      <ul aria-label="Saldo per rekening" className="divide-hairline divide-y">
        {DUMMY_CASH_ACCOUNTS.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="flex min-w-0 items-center gap-2 text-body font-medium">
              <span
                className="bg-chart-income size-1.5 shrink-0 rounded-full"
                aria-hidden
              />
              <span className="truncate">{row.name}</span>
            </span>
            <span
              className="shrink-0 text-body font-semibold tabular-nums"
              title={formatRupiah(row.amount)}
            >
              {formatRupiahCompact(row.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div className="border-border mt-2 flex items-center justify-between gap-3 border-t pt-2.5">
        <span className="text-muted-foreground text-caption">Total</span>
        <span
          className="text-body font-semibold tabular-nums"
          title={formatRupiah(total)}
        >
          {formatRupiahCompact(total)}
        </span>
      </div>
    </DashboardCard>
  );
}
