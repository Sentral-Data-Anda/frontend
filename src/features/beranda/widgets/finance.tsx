"use client";

import { Check } from "lucide-react";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  useDraftJournalCount,
  useFiscalPeriods,
  useIncomeByType,
} from "../api";
import {
  DUMMY_CASH_ACCOUNTS,
  DUMMY_CLOSING_CHECKS,
  SHOW_DUMMY,
} from "../fixtures";
import { monthOf, toDateKey } from "../model";

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

export function IncomeByTypeWidget() {
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
}

export function ClosingReadinessWidget() {
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
}
