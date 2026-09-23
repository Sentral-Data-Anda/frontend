/**
 * Pilihan tampilan Beranda (permintaan user 2026-09-23: "user admin harusnya
 * ada dropdown memilih mau dashboard seperti apa yang tampil").
 *
 * Cookie, bukan `localStorage`: halaman membacanya di server, jadi render
 * pertama sudah tampilan yang dipilih — tanpa kedipan dan tanpa hydration
 * mismatch. Pola yang sama dengan `sidebar_collapsed`.
 *
 * Ini keputusan TAMPILAN, bukan keamanan: gate izin per widget tetap
 * dijalankan `selectWidgets` apa pun isi cookie-nya. Nilai asing → "Semua".
 *
 * Berkas terpisah tanpa `"use client"` supaya halaman server bisa membaca
 * cookienya tanpa menarik seluruh registry widget ke bundel server.
 */

/** Grup widget. Menambah grup di sini otomatis menambah pilihan dropdown. */
export const KPI_GROUPS = ["finance", "umum"] as const;

export type KpiGroup = (typeof KPI_GROUPS)[number];

/** "Semua" = gabungan; selain itu satu grup saja. */
export type DashboardView = "all" | KpiGroup;

export const DASHBOARD_VIEW_COOKIE = "dashboard_view";

export const VIEW_LABEL: Record<DashboardView, string> = {
  all: "Semua",
  finance: "Keuangan",
  umum: "Umum",
};

export const readDashboardView = (value: string | undefined): DashboardView =>
  KPI_GROUPS.includes(value as KpiGroup) ? (value as KpiGroup) : "all";

export const dashboardViewCookie = (view: DashboardView): string =>
  `${DASHBOARD_VIEW_COOKIE}=${view}; Path=/; Max-Age=31536000; SameSite=Lax`;

/** Menyimpan pilihan; halaman berikutnya (server) membacanya kembali. */
export const saveDashboardView = (view: DashboardView) => {
  document.cookie = dashboardViewCookie(view);
};
