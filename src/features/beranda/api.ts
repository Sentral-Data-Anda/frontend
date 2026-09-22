"use client";

import { useQueries, useQuery } from "@tanstack/react-query";

import { fetchList, fetchOne } from "@/lib/api/fetcher";

/**
 * Satu baris `GET /api/v1/ibadah`, hanya field yang dipakai Beranda.
 *
 * Diverifikasi dari `be-sada/src/modules/ibadah/ibadah.repository.ts`: baris
 * `ibadah` apa adanya (tanpa kolom audit — global omit) plus relasi
 * `typeIbadah`, `room`, `bapel`, `jadwalPelayan` berbentuk `{ id, code, name }`.
 * `startTime` adalah jam dinding "HH:mm", bukan instant.
 */
export type IbadahListItem = {
  code: string;
  startTime: string;
  preacher: string | null;
  typeIbadah: { id: number; code: string; name: string };
};

/**
 * be-sada mengurutkan `date desc, startTime desc` (daftar dibaca untuk mencari
 * yang terbaru). Jadwal satu hari dibaca dari pagi ke malam. "HH:mm" yang
 * di-pad nol terurut benar secara leksikografis.
 */
export const sortByStartTime = <T extends { startTime: string }>(
  items: T[],
): T[] => [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));

export const ibadahKeys = {
  all: ["ibadah"] as const,
  list: (query: string) => [...ibadahKeys.all, "list", query] as const,
};

/**
 * Ibadah pada satu tanggal. `limit=100` (batas be-sada): bawaan 10 dan urutan
 * menurun berarti hari dengan >10 ibadah kehilangan yang paling pagi.
 *
 * `isEnabled` false untuk peran tanpa IBADAH VIEW — tanpa itu be-sada
 * menjawab 403 dan Beranda menampilkan galat untuk bagian yang tidak dirender.
 */
export function useIbadahByDate(date: string, isEnabled: boolean) {
  const query = `date=${date}&limit=100`;

  return useQuery({
    queryKey: ibadahKeys.list(query),
    queryFn: () => fetchList<IbadahListItem>(`/ibadah?${query}`),
    select: (response) => sortByStartTime(response.data),
    enabled: isEnabled,
  });
}

// ---------------------------------------------------------------------------
// Widget dashboard. Bentuk dan perilaku tiap endpoint diverifikasi dari
// be-sada (rujukan berkas di tiap tipe). Gate izin sudah dicek registry
// sebelum widget dirender, jadi hook di sini tidak menerima `isEnabled`.
// Uang be-sada (`Decimal`) tiba sebagai STRING — diubah ke number di sini.

const toAmount = (value: string | null | undefined) => Number(value ?? 0);

/** `persetujuan.repository.ts:46-64`. Tanpa nama pengaju / nomor dokumen. */
export type ApprovalItem = {
  code: string;
  documentType: string;
  amount: string;
  submittedAt: string;
  steps: { order: number; approverBapel: { name: string } | null }[];
  currentOrder: number;
};

/**
 * `GET /persetujuan?menunggu=saya` — urut paling lama menunggu dulu. 404
 * (kosong) → `[]` lewat `fetchList`. Dipakai KPI (totalData) dan daftar.
 */
export function useWaitingApprovals(isEnabled = true) {
  return useQuery({
    queryKey: ["persetujuan", "menunggu-saya"],
    queryFn: () =>
      fetchList<ApprovalItem>("/persetujuan?menunggu=saya&limit=10"),
    enabled: isEnabled,
  });
}

/** `ibadah.service.ts:98-105`: `startDate` + `endDate`, inklusif per hari. */
export type IbadahWeekItem = IbadahListItem & {
  date: string;
  room: { name: string } | null;
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

/**
 * `event.service.ts:48-53` — tanggal saja, tanpa jam; rentang =
 * CONTAINMENT (acara harus seluruhnya di dalam rentang). Acara yang mulai
 * sebelum hari ini dan masih berjalan tidak ikut.
 */
export type EventItem = {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
  room: { name: string } | null;
  bapel: { name: string };
};

export function useEventRange(start: string, end: string, isEnabled: boolean) {
  const query = `startDate=${start}&endDate=${end}&limit=100`;

  return useQuery({
    queryKey: ["event", "list", query],
    queryFn: () => fetchList<EventItem>(`/event?${query}`),
    select: (response) => response.data,
    enabled: isEnabled,
  });
}

/** `public.service.ts:8-16` — tanpa sesi; hanya `limit`. */
export type AnnouncementItem = {
  id: string;
  category: string;
  title: string;
  publishDate: string;
  isPinned: boolean;
};

export function usePublicAnnouncements(limit: number) {
  return useQuery({
    queryKey: ["public", "announcement", limit],
    queryFn: () =>
      fetchList<AnnouncementItem>(`/public/announcement?limit=${limit}`),
    select: (response) => response.data,
  });
}

/** `persembahan.repository.ts:6-31` — hanya ACTIVE, urut periode menurun. */
export type OfferingItem = {
  code: string;
  amount: string;
  period: string | null;
  receivedDate: string;
  typePersembahan: { name: string };
};

/**
 * Persembahan user sendiri tahun ini (`periodStart`/`periodEnd` pada
 * `period`). Total dihitung dari daftar — be-sada belum punya total;
 * `limit=100` (batas be-sada) cukup untuk satu tahun persembahan bulanan.
 */
export function useMyOfferings(year: string) {
  const query = `periodStart=${year}-01&periodEnd=${year}-12&limit=100`;

  return useQuery({
    queryKey: ["persembahan", "saya", query],
    queryFn: () => fetchList<OfferingItem>(`/persembahan/saya?${query}`),
    select: (response) => ({
      items: response.data,
      count: response.totalData,
      total: response.data.reduce((sum, row) => sum + toAmount(row.amount), 0),
    }),
  });
}

/** `kas_keluar.repository.ts:6-19` — urut `expenseDate` menurun. */
export type CashExpenseItem = {
  code: string;
  expenseDate: string;
  description: string;
  payee: string;
  totalAmount: string;
  bapel: { name: string } | null;
};

/**
 * Kas keluar DRAF. `limit=100` (batas be-sada): total "Perlu dibayar"
 * dijumlah dari daftar — be-sada tidak mengirim total.
 */
export function useDraftCashExpenses(isEnabled = true) {
  return useQuery({
    queryKey: ["kas-keluar", "list", "status=DRAFT"],
    queryFn: () =>
      fetchList<CashExpenseItem>("/kas-keluar?status=DRAFT&limit=100"),
    enabled: isEnabled,
  });
}

export const amountOf = toAmount;

/** `report.service.ts:112-120` — tanpa paginasi, 404 bila kosong. */
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

/** `loan_room.repository.ts:30-57`. */
export type LoanRoomItem = {
  code: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  room: { name: string };
  jemaat: { name: string };
};

/**
 * Peminjaman menunggu persetujuan, 30 hari ke depan. be-sada TIDAK punya
 * filter status (`loan_room.service.ts:26-73`), jadi disaring di sini dari
 * satu halaman 100 baris.
 *
 * ponytail: > 100 peminjaman dalam 30 hari → sebagian tidak terhitung;
 * minta `?status=PENDING` ke be-sada bila itu terjadi.
 */
export function usePendingLoanRooms(start: string, end: string) {
  const query = `startDate=${start}&endDate=${end}&limit=100`;

  return useQuery({
    queryKey: ["loan-room", "list", query],
    queryFn: () => fetchList<LoanRoomItem>(`/loan-room?${query}`),
    select: (response) =>
      response.data.filter((row) => row.status === "PENDING"),
  });
}

// ---------------------------------------------------------------------------
// Laporan keuangan — `laporan_keuangan.service.ts` + `financialReport.ts`.
// Hanya jurnal POSTED; tanpa 404 (akun nol tetap dikirim). Sebelum bagan
// akun & periode fiskal siap (E1/E11) angkanya bisa nol semua.

type Totals<K extends string> = { totals: Record<K, string> };

/** `GET /laporan-keuangan/neraca?date=` — `date` wajib. */
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

/** `GET /laporan-keuangan/surplus-defisit?from=&to=` — keduanya wajib. */
export function useSurplusDefisit(from: string, to: string) {
  return useQuery(surplusDefisitQuery(from, to));
}

/** Simpul akun `financialReport.ts:5-18` (uang = string Decimal). */
export type AccountNode = {
  code: string;
  name: string;
  total: string;
  children: AccountNode[];
};

/**
 * Pemasukan per jenis: anak langsung simpul pendapatan tingkat atas di
 * pohon INCOME `surplus-defisit` (akar tanpa anak dihitung sendiri). Kunci
 * cache sama dengan `useSurplusDefisit` — satu permintaan.
 *
 * Benar sebagai "per jenis persembahan" hanya bila satu jenis = satu akun
 * pendapatan (pertanyaan U2, dashboard-desktop.md §10.6).
 */
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

/** `faktur_supplier.repository.ts:5-45` — urut `dueDate` naik. */
export type SupplierInvoiceItem = {
  code: string;
  dueDate: string;
  totalIDR: string;
  paidAmountIDR: string;
  status: "AWAITING_PAYMENT" | "PARTIALLY_PAID";
  supplier: { name: string };
};

/**
 * Faktur belum lunas. `status` be-sada hanya menerima SATU nilai (daftar
 * berkoma → 400), jadi dua permintaan. Sisa tagihan = `totalIDR −
 * paidAmountIDR` (tidak dikirim be-sada).
 */
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

/** `pembayaran.repository.ts:9-21` — urut `id` menurun. */
export type PaymentItem = {
  code: string;
  purpose: "PERSEMBAHAN" | "EVENT_REGISTRATION";
  amount: string;
  status: "FAILED" | "EXPIRED";
  createdAt: string;
  jemaat: { name: string } | null;
  donorName: string | null;
};

/** Pembayaran online gagal atau kedaluwarsa (dua permintaan, `status` tunggal). */
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

/** `payroll.repository.ts:41-46` — tanpa relasi, urut tahun/bulan menurun. */
export type PayrollItem = {
  code: string;
  year: number;
  month: number;
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "PAID" | "CANCELLED";
  totalNet: string;
  createdAt: string;
};

/**
 * Penggajian yang belum dibayar. Satu permintaan (12 terbaru) disaring di FE
 * — `status` tunggal akan butuh tiga permintaan (DRAFT/CALCULATED/APPROVED).
 */
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

/** `periode_fiskal.service.ts:74-99` — `id` = publicId, `label` "September 2026". */
export type FiscalPeriodItem = {
  id: string;
  year: number;
  month: number;
  label: string;
  status: "OPEN" | "CLOSED";
};

/** 24 periode terbaru (dua tahun) — cukup untuk bulan ini dan bulan lalu. */
export function useFiscalPeriods() {
  return useQuery({
    queryKey: ["periode-fiskal", "list", "limit=24"],
    queryFn: () => fetchList<FiscalPeriodItem>("/periode-fiskal?limit=24"),
    select: (response) => response.data,
  });
}

/** Jumlah jurnal DRAF (`totalData`; satu baris cukup). */
export function useDraftJournalCount(isEnabled: boolean) {
  return useQuery({
    queryKey: ["jurnal", "list", "status=DRAFT&limit=1"],
    queryFn: () => fetchList<unknown>("/jurnal?status=DRAFT&limit=1"),
    select: (response) => response.totalData,
    enabled: isEnabled,
  });
}

/** Satukan beberapa daftar berpaginasi menjadi satu keadaan widget. */
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

/** Hari terakhir bulan `YYYY-MM`. */
const lastDayOf = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(year, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

/**
 * Masuk/keluar per bulan, Januari s.d. bulan `today` (tahun kalender —
 * asumsi BA #8). MVP = satu `surplus-defisit` per bulan (dashboard-desktop.md
 * §4); bulan yang belum datang tidak diminta. Bulan berjalan dihitung
 * sampai hari ini.
 */
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

/** `report.service.ts:14-32` — satu baris per tipe jemaat yang ada. */
export type JemaatTypeCount = {
  typeJemaat: "ANGGOTA" | "SIMPATISAN";
  ALL: number;
  L: number;
  P: number;
};

/** Jumlah jemaat per tipe & gender (tanpa paginasi; 200 `[]` bila kosong). */
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

/**
 * Ulang tahun pada rentang tujuh hari: `/report/jemaat/birth/:month` per
 * bulan yang disentuh minggu itu (1–2 panggilan, §10.2), disaring di FE.
 */
export function useBirthdaysInRange(days: string[]) {
  const months = [...new Set(days.map((day) => Number(day.slice(5, 7))))];

  return useQueries({
    queries: months.map((month) => ({
      queryKey: ["report", "birth", month],
      queryFn: () => fetchList<BirthdayItem>(`/report/jemaat/birth/${month}`),
      select: (response: { data: BirthdayItem[] }) => response.data,
    })),
    combine: (results) => ({
      // Cocokkan "MM-DD" ulang tahun dengan hari-hari minggu ini (tahun
      // lahir diabaikan, dan tidak pernah ditampilkan — privasi).
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
