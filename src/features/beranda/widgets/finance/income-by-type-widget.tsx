"use client";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

import { useIncomeByType } from "../../api";
import { toDateKey } from "../../model";

export const IncomeByTypeWidget = () => {
  const today = toDateKey(new Date());
  const query = useIncomeByType(`${today.slice(0, 7)}-01`, today);
  const data = query.data;

  return (
    <DashboardCard
      title="Pemasukan per jenis · bulan ini"
      query={query}
      minHeight="min-h-36"
    >
      {!data || data.parts.length === 0 ? (
        <EmptyState isCompact title="Belum ada pemasukan bulan ini" />
      ) : (
        <ul aria-label="Pemasukan per jenis" className="space-y-3">
          {data.parts.slice(0, 5).map((part) => (
            <li key={part.code}>
              <ProgressBar
                label={part.name}
                value={data.total > 0 ? (part.amount / data.total) * 100 : 0}
                meta={`${Math.round(data.total > 0 ? (part.amount / data.total) * 100 : 0)}% · ${formatRupiahCompact(part.amount)}`}
                title={formatRupiah(part.amount)}
              />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
};
