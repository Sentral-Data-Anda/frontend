"use client";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { DUMMY_BUDGET_USE } from "../../fixtures";

export const BudgetUseWidget = () => {
  return (
    <DashboardCard title="Realisasi vs pagu · komisi" isDummy>
      <ul aria-label="Realisasi vs pagu per komisi" className="space-y-3.5">
        {DUMMY_BUDGET_USE.map((row) => {
          const percent = row.budget > 0 ? (row.used / row.budget) * 100 : 0;
          return (
            <li key={row.id}>
              <ProgressBar
                label={row.commission}
                value={percent}
                alertAbove={80}
                meta={`${Math.round(percent)}% · ${formatRupiahCompact(row.used)} / ${formatRupiahCompact(row.budget)}`}
              />
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
};
