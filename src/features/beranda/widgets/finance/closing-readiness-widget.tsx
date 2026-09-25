"use client";

import { Check } from "lucide-react";

import { DashboardCard } from "@/components/common/dashboard";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { useDraftJournalCount, useFiscalPeriods } from "../../api";
import { DUMMY_CLOSING_CHECKS, SHOW_DUMMY } from "../../fixtures";
import { monthOf, toDateKey } from "../../model";

export const ClosingReadinessWidget = () => {
  const now = new Date();
  const month = monthOf(now);
  const year = Number(toDateKey(now).slice(0, 4));
  const periods = useFiscalPeriods();
  const isJournalShown = useMenuAccess(MENU.JURNAL).isCanView;
  const journals = useDraftJournalCount(isJournalShown);

  const periodOf = (y: number, m: number) =>
    periods.data?.find((row) => row.year === y && row.month === m);
  const current = periodOf(year, month);
  const previous = periodOf(
    month === 1 ? year - 1 : year,
    month === 1 ? 12 : month - 1,
  );

  const checks = [
    {
      id: "current",
      label: current
        ? `Periode ${current.label} ${current.status === "OPEN" ? "terbuka" : "tertutup"}`
        : "Periode bulan ini belum dibuka",
      isReady: current?.status === "OPEN",
      isDummy: false,
    },
    {
      id: "previous",
      label: previous
        ? `Periode ${previous.label} ${previous.status === "CLOSED" ? "sudah ditutup" : "masih terbuka"}`
        : "Periode bulan lalu belum dibuka",
      isReady: previous?.status === "CLOSED",
      isDummy: false,
    },
    ...(isJournalShown
      ? [
          {
            id: "journals",
            label:
              journals.data === 0
                ? "Tidak ada jurnal draf"
                : `${journals.data ?? 0} jurnal masih draf`,
            isReady: journals.data === 0,
            isDummy: false,
          },
        ]
      : []),
    ...(SHOW_DUMMY
      ? DUMMY_CLOSING_CHECKS.map((check) => ({ ...check, isDummy: true }))
      : []),
  ];
  const ready = checks.filter((check) => check.isReady).length;

  return (
    <DashboardCard
      title="Kesiapan tutup buku"
      trailing={
        <span className="text-muted-foreground text-body tabular-nums">
          {ready}/{checks.length}
        </span>
      }
      actionLabel="Periode fiskal"
      actionHref={menuHref(MENU.KEUANGAN, MENU.PERIODE_FISKAL)}
      query={periods}
      minHeight="min-h-32"
    >
      <ul aria-label="Kesiapan tutup buku" className="space-y-2.5">
        {checks.map((check) => (
          <li
            key={check.id}
            className={cn(
              "flex items-center gap-2 text-body",
              !check.isReady && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full",
                check.isReady ? "bg-success" : "bg-border",
              )}
            >
              {check.isReady ? (
                <Check
                  className="text-success-foreground size-2.5"
                  strokeWidth={3}
                  aria-label="siap"
                />
              ) : (
                <span className="sr-only">belum</span>
              )}
            </span>
            <span className="min-w-0 truncate" title={check.label}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
};
