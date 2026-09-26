"use client";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";

import { useZoneCounts } from "../../api";

const TITLE = "Jemaat per wilayah";

export const ZonesWidget = () => {
  const query = useZoneCounts();
  const bars = query.data ?? [];
  const total = bars.reduce((sum, bar) => sum + bar.count, 0);

  return (
    <DashboardCard
      title={TITLE}
      query={query}
      minHeight="min-h-32"
      trailing={
        total > 0 ? (
          <span className="text-muted-foreground text-body tabular-nums">
            {total.toLocaleString("id-ID")} total
          </span>
        ) : null
      }
    >
      {total === 0 ? (
        <EmptyState isCompact title="Belum ada jemaat berwilayah" />
      ) : (
        <ul aria-label={TITLE} className="space-y-3.5">
          {bars.map((bar) => (
            <li key={bar.key}>
              <ProgressBar
                label={bar.label}
                value={(bar.count / total) * 100}
                meta={bar.count.toLocaleString("id-ID")}
              />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
};
