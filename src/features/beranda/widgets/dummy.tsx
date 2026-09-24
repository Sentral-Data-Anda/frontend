"use client";

import { DashboardCard } from "@/components/common/dashboard/dashboard-card";
import {
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard/dashboard-card";
import { ProgressBar } from "@/components/common/dashboard/progress-bar";
import { formatRupiahCompact } from "@/lib/format";

import { DUMMY_BUDGET_USE, DUMMY_NEW_MEMBERS, DUMMY_ZONES } from "../fixtures";
import { formatDayMonth } from "../model";

/*
 * DUMMY — widget yang endpoint-nya belum ada di be-sada. Registry
 * (`widgets.tsx`) menandai semuanya `isDummy`, jadi tidak pernah dirender di
 * production, dan panelnya membawa tanda "contoh data". Lihat `dummy.ts`.
 */

/**
 * Realisasi vs pagu per komisi — batang progres, bukan gauge (§10.2):
 * perbandingan antar-komisi terbaca dari panjang batang. > 80% ditandai ikon.
 */
export function BudgetUseWidget() {
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
}

/** Jemaat per wilayah — butuh route `jemaatByZone` di be-sada (§10.4). */
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

/** Jemaat baru bulan ini — butuh endpoint sendiri (bukan `Jemaat.createdAt`). */
export function NewMembersWidget() {
  return (
    <DashboardCard title="Jemaat baru · bulan ini" isDummy>
      <DashboardList label="Jemaat baru bulan ini">
        {DUMMY_NEW_MEMBERS.map((member) => (
          <DashboardRow
            key={member.id}
            title={member.name}
            meta={member.note}
            trailing={formatDayMonth(member.date)}
          />
        ))}
      </DashboardList>
    </DashboardCard>
  );
}
