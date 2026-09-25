"use client";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";

import { DUMMY_ZONES } from "../../fixtures";

export function ZonesWidget() {
  const total = DUMMY_ZONES.reduce((sum, zone) => sum + zone.count, 0);

  return (
    <DashboardCard
      title="Jemaat per wilayah"
      isDummy
      trailing={
        <span className="text-muted-foreground text-body tabular-nums">
          {total.toLocaleString("id-ID")} total
        </span>
      }
    >
      <ul aria-label="Jemaat per wilayah" className="space-y-3.5">
        {DUMMY_ZONES.map((zone) => (
          <li key={zone.id}>
            <ProgressBar
              label={zone.name}
              value={total > 0 ? (zone.count / total) * 100 : 0}
              meta={zone.count.toLocaleString("id-ID")}
            />
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
