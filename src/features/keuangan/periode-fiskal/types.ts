import type { PeriodStatus } from "@/types/keuangan";

export type FiscalPeriod = {
  id: string;
  year: number;
  month: number;
  label: string;
  status: PeriodStatus;
  startDate: string;
  endDate: string;
  closedBy: { name: string } | null;
  closedAt: string | null;
  reopenedBy: { name: string } | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  draftCount: number;
};

export type FiscalPeriodDetail = FiscalPeriod & {
  unpostedPersembahanCount?: number;
  unpaidApprovedExpenseCount?: number;
};

export type OpenYearPayload = { year: number };

export type ReopenPayload = { reopenReason: string };
