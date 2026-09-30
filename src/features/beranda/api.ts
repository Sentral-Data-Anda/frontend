"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { IbadahPlace } from "@/lib/ibadah-place";
import type { ApprovalDocumentType } from "@/types/persetujuan";

export type IbadahListItem = {
  code: string;
  startTime: string;
  preacher: string | null;
  typeIbadah: { id: number; code: string; name: string };
};

export const sortByStartTime = <T extends { startTime: string }>(
  items: T[],
): T[] => [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

export const ibadahKeys = {
  all: ["ibadah"] as const,
  list: (query: string) => [...ibadahKeys.all, "list", query] as const,
};

export function useIbadahByDate(date: string, isEnabled: boolean) {
  const query = `date=${date}&limit=100`;

  return useQuery({
    queryKey: ibadahKeys.list(query),
    queryFn: () => fetchList<IbadahListItem>(`/ibadah?${query}`),
    select: (response) => sortByStartTime(response.data),
    enabled: isEnabled,
  });
}

const toAmount = (value: string | null | undefined) => Number(value ?? 0);

export type ApprovalItem = {
  code: string;
  documentType: ApprovalDocumentType;
  amount: string;
  submittedAt: string;
  steps: { order: number; approverBapel: { name: string } | null }[];
  currentOrder: number;
};

export function useWaitingApprovals(isEnabled = true) {
  return useQuery({
    queryKey: ["persetujuan", "menunggu-saya"],
    queryFn: () =>
      fetchList<ApprovalItem>("/persetujuan?menunggu=saya&limit=10"),
    enabled: isEnabled,
  });
}

export type IbadahWeekItem = IbadahListItem &
  IbadahPlace & {
    date: string;
  };

export function useIbadahRange(start: string, end: string, isEnabled = true) {
  const query = `startDate=${start}&endDate=${end}&limit=100`;

  return useQuery({
    queryKey: ibadahKeys.list(query),
    queryFn: () => fetchList<IbadahWeekItem>(`/ibadah?${query}`),
    select: (response) => response.data,
    enabled: isEnabled,
  });
}

export type EventItem = {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  location: string | null;
  room: { name: string } | null;
  bapel: { name: string };
};

export function useEventRange(start: string, end: string, isEnabled: boolean) {
  const query = `startDate=${start}&endDate=${end}&isPublish=1&limit=100`;

  return useQuery({
    queryKey: ["event", "list", query],
    queryFn: () => fetchList<EventItem>(`/event?${query}`),
    select: (response) => response.data,
    enabled: isEnabled,
  });
}

export type AnnouncementItem = {
  id: string;
  category: string;
  title: string;
  publishDate: string;
  isPinned: boolean;
  bapelName: string | null;
};

export function useAnnouncementFeed(limit: number) {
  return useQuery({
    queryKey: ["pengumuman", "feed", limit],
    queryFn: () =>
      fetchList<AnnouncementItem>(`/pengumuman/feed?limit=${limit}`),
    select: (response) => response.data,
  });
}

export type CashExpenseItem = {
  code: string;
  expenseDate: string;
  description: string;
  payee: string;
  totalAmount: string;
  bapel: { name: string } | null;
};

export function useDraftCashExpenses(isEnabled = true) {
  return useQuery({
    queryKey: ["kas-keluar", "list", "status=DRAFT"],
    queryFn: () =>
      fetchList<CashExpenseItem>("/kas-keluar?status=DRAFT&limit=100"),
    enabled: isEnabled,
  });
}

export const amountOf = toAmount;

export type BirthdayItem = {
  name: string;
  gender: "L" | "P";
  birthDate: string;
  umur: number;
};

export function useBirthdays(month: number) {
  return useQuery({
    queryKey: ["report", "birth", month],
    queryFn: () => fetchList<BirthdayItem>(`/report/jemaat/birth/${month}`),
    select: (response) => response.data,
  });
}

export type LoanRoomItem = {
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  room: { name: string };
  jemaat: { name: string };
};

export function useLoanRoomsInRange(start: string, end: string) {
  const query = `startDate=${start}&endDate=${end}&limit=100`;

  return useQuery({
    queryKey: ["loan-room", "list", query],
    queryFn: () => fetchList<LoanRoomItem>(`/loan-room?${query}`),
    select: (response) => response.data,
  });
}

type Totals<K extends string> = { totals: Record<K, string> };

export function useNeraca(date: string) {
  return useQuery({
    queryKey: ["laporan-keuangan", "neraca", date],
    queryFn: () =>
      fetchOne<Totals<"assets" | "liabilities" | "equity" | "surplus">>(
        `/laporan-keuangan/neraca?date=${date}`,
      ),
    select: (response) => ({ assets: toAmount(response.data.totals.assets) }),
  });
}

const surplusDefisitQuery = (from: string, to: string) => ({
  queryKey: ["laporan-keuangan", "surplus-defisit", from, to],
  queryFn: () =>
    fetchOne<Totals<"income" | "expense" | "surplus">>(
      `/laporan-keuangan/surplus-defisit?from=${from}&to=${to}`,
    ),
  select: (response: { data: Totals<"income" | "expense" | "surplus"> }) => ({
    income: toAmount(response.data.totals.income),
    expense: toAmount(response.data.totals.expense),
    surplus: toAmount(response.data.totals.surplus),
  }),
});

export function useSurplusDefisit(from: string, to: string) {
  return useQuery(surplusDefisitQuery(from, to));
}

export type AccountNode = {
  code: string;
  name: string;
  total: string;
  children: AccountNode[];
};

export function useIncomeByType(from: string, to: string) {
  return useQuery({
    queryKey: ["laporan-keuangan", "surplus-defisit", from, to],
    queryFn: () =>
      fetchOne<{ income: AccountNode[]; totals: Record<string, string> }>(
        `/laporan-keuangan/surplus-defisit?from=${from}&to=${to}`,
      ),
    select: (response) => {
      const parts = response.data.income.flatMap((root) =>
        root.children.length ? root.children : [root],
      );
      return {
        total: toAmount(response.data.totals.income),
        parts: parts
          .map((node) => ({
            code: node.code,
            name: node.name,
            amount: toAmount(node.total),
          }))
          .filter((part) => part.amount > 0)
          .sort((a, b) => b.amount - a.amount),
      };
    },
  });
}

export type SupplierInvoiceItem = {
  code: string;
  dueDate: string;
  totalIDR: string;
  paidAmountIDR: string;
  status: "AWAITING_PAYMENT" | "PARTIALLY_PAID";
  supplier: { name: string };
};

export function useUnpaidInvoices(isEnabled: boolean) {
  return useQueries({
    queries: (["AWAITING_PAYMENT", "PARTIALLY_PAID"] as const).map(
      (status) => ({
        queryKey: ["faktur-supplier", "list", `status=${status}`],
        queryFn: () =>
          fetchList<SupplierInvoiceItem>(
            `/faktur-supplier?status=${status}&limit=100`,
          ),
        enabled: isEnabled,
      }),
    ),
    combine: combineLists,
  });
}

export type PaymentItem = {
  code: string;
  purpose: "PERSEMBAHAN" | "EVENT_REGISTRATION";
  amount: string;
  status: "FAILED" | "EXPIRED";
  createdAt: string;
};

export function useFailedPayments(isEnabled: boolean) {
  return useQueries({
    queries: (["FAILED", "EXPIRED"] as const).map((status) => ({
      queryKey: ["pembayaran", "list", `status=${status}`],
      queryFn: () =>
        fetchList<PaymentItem>(`/pembayaran?status=${status}&limit=20`),
      enabled: isEnabled,
    })),
    combine: combineLists,
  });
}

export type PayrollItem = {
  code: string;
  year: number;
  month: number;
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "PAID" | "CANCELLED";
  totalNet: string;
  createdAt: string;
};

export function useOpenPayrolls(isEnabled: boolean) {
  return useQuery({
    queryKey: ["payroll", "list", "limit=12"],
    queryFn: () => fetchList<PayrollItem>("/payroll?limit=12"),
    select: (response) =>
      response.data.filter(
        (row) => row.status !== "PAID" && row.status !== "CANCELLED",
      ),
    enabled: isEnabled,
  });
}

export type FiscalPeriodItem = {
  id: string;
  year: number;
  month: number;
  label: string;
  status: "OPEN" | "CLOSED";
};

export function useFiscalPeriods() {
  return useQuery({
    queryKey: ["periode-fiskal", "list", "limit=24"],
    queryFn: () => fetchList<FiscalPeriodItem>("/periode-fiskal?limit=24"),
    select: (response) => response.data,
  });
}

export function useDraftJournalCount(isEnabled: boolean) {
  return useQuery({
    queryKey: ["jurnal", "list", "status=DRAFT&limit=1"],
    queryFn: () => fetchList<unknown>("/jurnal?status=DRAFT&limit=1"),
    select: (response) => response.totalData,
    enabled: isEnabled,
  });
}

function combineLists<T>(
  results: {
    data?: { data: T[] };
    isPending: boolean;
    isFetching: boolean;
    error: Error | null;
    refetch: () => unknown;
  }[],
) {
  return {
    data: results.flatMap((result) => result.data?.data ?? []),
    isPending: results.some((result) => result.isPending),
    isFetching: results.some((result) => result.isFetching),
    error: results.find((result) => result.error)?.error ?? null,
    refetch: () => results.forEach((result) => void result.refetch()),
  };
}

const lastDayOf = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(year, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

export function useMonthlyFlow(today: string) {
  const year = today.slice(0, 4);
  const months = Array.from(
    { length: Number(today.slice(5, 7)) },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );

  return useQueries({
    queries: months.map((month) =>
      surplusDefisitQuery(
        `${month}-01`,
        month === today.slice(0, 7) ? today : lastDayOf(month),
      ),
    ),
    combine: (results) => ({
      months: results.map((result, i) => ({
        month: months[i],
        income: result.data?.income ?? 0,
        expense: result.data?.expense ?? 0,
      })),
      isPending: results.some((result) => result.isPending),
      isFetching: results.some((result) => result.isFetching),
      error: results.find((result) => result.error)?.error ?? null,
      refetch: () => results.forEach((result) => void result.refetch()),
    }),
  });
}

export type JemaatTypeCount = {
  typeJemaat: "ANGGOTA" | "SIMPATISAN";
  ALL: number;
  L: number;
  P: number;
};

export function useJemaatStats() {
  return useQuery({
    queryKey: ["report", "type-gender"],
    queryFn: () => fetchList<JemaatTypeCount>("/report/jemaat/type-gender"),
    select: (response) => {
      const rows = response.data;
      const total = rows.reduce((sum, row) => sum + row.ALL, 0);
      return {
        total,
        member: rows.find((row) => row.typeJemaat === "ANGGOTA")?.ALL ?? 0,
      };
    },
  });
}

export type ZoneCount = {
  zoneChurchId: number | null;
  name: string | null;
  isActive: boolean | null;
  anggota: number;
  simpatisan: number;
};

const zoneLabel = (row: ZoneCount) =>
  row.zoneChurchId === null
    ? "Tanpa wilayah"
    : row.isActive === false
      ? `${row.name} (nonaktif)`
      : (row.name ?? "");

export const toZoneBars = (rows: ZoneCount[]) =>
  rows
    .map((row) => ({
      key: String(row.zoneChurchId ?? "tanpa"),
      label: zoneLabel(row),
      count: row.anggota + row.simpatisan,
      isOptional: row.zoneChurchId === null || row.isActive === false,
    }))
    .filter((bar) => bar.count > 0 || !bar.isOptional);

export function useZoneCounts() {
  return useQuery({
    queryKey: ["report", "zone"],
    queryFn: () => fetchList<ZoneCount>("/report/jemaat/zone"),
    select: (response) => toZoneBars(response.data),
  });
}

export type TugasSayaItem = {
  date: string;
  startTime: string;
  endTime: string;
  jadwal: { code: string; name: string };
  bapel: { name: string };
  role: { name: string };
  musikSkill: { name: string } | null;
  group: { name: string } | null;
  ibadah: { code: string; typeIbadah: { name: string } }[];
};

export const tugasSayaKey = (today: string) =>
  ["jadwal-pelayan", "saya", today] as const;

export function useTugasSaya(today: string) {
  return useQuery({
    queryKey: tugasSayaKey(today),
    queryFn: () => fetchList<TugasSayaItem>("/jadwal-pelayan/saya"),
    select: (response) => response.data,
  });
}

export function useBirthdaysInRange(days: string[]) {
  const months = [...new Set(days.map((day) => Number(day.slice(5, 7))))];

  return useQueries({
    queries: months.map((month) => ({
      queryKey: ["report", "birth", month],
      queryFn: () => fetchList<BirthdayItem>(`/report/jemaat/birth/${month}`),
      select: (response: { data: BirthdayItem[] }) => response.data,
    })),
    combine: (results) => ({
      data: results
        .flatMap((result) => result.data ?? [])
        .map((row) => ({ ...row, dayKey: row.birthDate.slice(5, 10) }))
        .filter((row) => days.some((day) => day.slice(5) === row.dayKey))
        .sort((a, b) => a.dayKey.localeCompare(b.dayKey)),
      isPending: results.some((result) => result.isPending),
      isFetching: results.some((result) => result.isFetching),
      error: results.find((result) => result.error)?.error ?? null,
      refetch: () => results.forEach((result) => void result.refetch()),
    }),
  });
}
