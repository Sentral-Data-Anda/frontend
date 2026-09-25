"use client";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

import { amountOf, useMyOfferings } from "../../api";
import { formatDayMonth, formatMonthYear, toDateKey } from "../../model";

export const MyOfferingsWidget = () => {
  const year = toDateKey(new Date()).slice(0, 4);
  const query = useMyOfferings(year);
  const data = query.data;

  return (
    <DashboardCard title="Persembahan saya" query={query} minHeight="min-h-28">
      {!data || data.count === 0 ? (
        <EmptyState
          isCompact
          title={`Belum ada persembahan tercatat tahun ${year}`}
        />
      ) : (
        <>
          <p className="text-body">
            <span className="text-title font-semibold tabular-nums">
              {formatRupiah(data.total)}
            </span>{" "}
            <span className="text-muted-foreground">
              tahun {year} · {data.count} kali
            </span>
          </p>
          <DashboardList label="Persembahan terakhir">
            {data.items.slice(0, 3).map((item) => (
              <DashboardRow
                key={item.code}
                title={item.typePersembahan.name}
                meta={
                  item.period
                    ? `Periode ${formatMonthYear(item.period)}`
                    : formatDayMonth(item.receivedDate)
                }
                trailing={formatRupiahCompact(amountOf(item.amount))}
              />
            ))}
          </DashboardList>
        </>
      )}
    </DashboardCard>
  );
};
