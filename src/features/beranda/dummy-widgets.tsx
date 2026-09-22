"use client";

import { Check, CircleAlert } from "lucide-react";

import {
  DashboardCard,
  DashboardList,
  DashboardRow,
} from "@/components/common/dashboard-card";
import { KpiCell } from "@/components/common/kpi-strip";
import { TimeBadge } from "@/components/common/time-badge";
import { formatRupiahCompact } from "@/lib/format";

import {
  DUMMY_BOOKKEEPING,
  DUMMY_BUDGET_USE,
  DUMMY_MY_DUTIES,
  type BudgetUse,
} from "./dummy";
import {
  addDaysKey,
  formatDayMonth,
  formatWeekdayShort,
  toDateKey,
} from "./time";

/*
 * DUMMY — widget yang endpoint-nya belum ada di be-sada. Registry
 * (`widgets.tsx`) menandai semuanya `isDummy`, jadi tidak pernah dirender di
 * production. Lihat `dummy.ts`.
 */

const dutyDate = (inDays: number) => addDaysKey(toDateKey(new Date()), inDays);

/** Jadwal pelayanan saya, 4 minggu ke depan. */
export function MyDutiesWidget() {
  return (
    <DashboardCard title="Jadwal pelayanan saya">
      <DashboardList label="Jadwal pelayanan saya">
        {DUMMY_MY_DUTIES.map((duty) => {
          const date = dutyDate(duty.inDays);
          return (
            <DashboardRow
              key={duty.id}
              leading={<TimeBadge time={duty.time} />}
              title={duty.role}
              meta={`${formatWeekdayShort(date)}, ${formatDayMonth(date)} · ${duty.service}`}
            />
          );
        })}
      </DashboardList>
    </DashboardCard>
  );
}

/** Untuk tab "Tugas saya" Agenda: tugas pada satu hari. */
export const dutiesOn = (day: string) =>
  DUMMY_MY_DUTIES.filter((duty) => dutyDate(duty.inDays) === day);

const usedRatio = ({ budget, used }: BudgetUse) =>
  budget > 0 ? used / budget : 0;

/**
 * Pagu terpakai per komisi — batang progres, bukan gauge (dashboard-desktop.md
 * §1.4): perbandingan antar-komisi terbaca dari panjang batang. > 80% ditandai
 * ikon peringatan; batang tetap `primary` (skala warning < 3:1 terhadap putih,
 * hanya boleh jadi bidang).
 */
export function BudgetUseWidget() {
  return (
    <DashboardCard title="Pagu terpakai">
      <ul aria-label="Pagu terpakai per komisi" className="space-y-3">
        {DUMMY_BUDGET_USE.map((row) => {
          const ratio = usedRatio(row);
          const percent = Math.round(ratio * 100);
          const isHigh = ratio > 0.8;
          return (
            <li key={row.id}>
              <div className="flex items-baseline justify-between gap-3 text-body">
                <span className="truncate font-medium">{row.commission}</span>
                <span className="flex shrink-0 items-center gap-1 tabular-nums">
                  {isHigh ? (
                    <CircleAlert
                      className="size-3.5"
                      aria-label="di atas 80%"
                    />
                  ) : null}
                  {percent}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`${row.commission} pagu terpakai`}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="bg-muted mt-1 h-2 overflow-hidden rounded-full"
              >
                <div
                  className="bg-primary h-full"
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-0.5 text-caption tabular-nums">
                {formatRupiahCompact(row.used)} dari{" "}
                {formatRupiahCompact(row.budget)}
              </p>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}

export function KpiBudgetHigh() {
  const count = DUMMY_BUDGET_USE.filter((row) => usedRatio(row) > 0.8).length;
  return (
    <KpiCell
      label="Komisi > 80% pagu"
      value={`${count} komisi`}
      hint="Tahun berjalan"
    />
  );
}

/** Kesiapan pembukuan (periode fiskal + setelan akuntansi). */
export function BookkeepingWidget() {
  return (
    <DashboardCard title="Kesiapan pembukuan">
      <ul aria-label="Kesiapan pembukuan" className="space-y-2">
        {DUMMY_BOOKKEEPING.map((check) => (
          <li key={check.id} className="flex items-center gap-2 text-body">
            {check.isReady ? (
              <Check
                className="text-success size-4 shrink-0"
                aria-label="Siap"
              />
            ) : (
              <CircleAlert className="size-4 shrink-0" aria-label="Belum" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}
