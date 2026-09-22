/**
 * ============================================================================
 *  DATA DUMMY BERANDA — HAPUS SAAT DATA ASLI ADA
 * ============================================================================
 *
 *  Sumber data asli untuk bagian-bagian ini BELUM ADA di be-sada:
 *
 *  - Notifikasi: modul notifikasi be-sada ditunda.
 *
 *  Karena itu semuanya HANYA dirender saat `SHOW_DUMMY` — di luar production.
 *  Di production widget dummy dan lonceng tidak muncul sama sekali (bukan "Rp 0",
 *  bukan placeholder). Angka palsu di layar bendahara lebih berbahaya daripada
 *  tidak ada angka. Widget yang memakai fixture di sini ditandai `isDummy` di
 *  registry (`widgets.tsx`), yang menyaringnya dengan `SHOW_DUMMY`.
 *
 *  Saat endpoint asli tersedia: ganti fixture dengan hook data, hapus
 *  `isDummy` widget itu di registry, dan hapus fixture-nya dari berkas ini.
 *
 *  Tidak ditiru di `scripts/dev-mock.ts`: tiruan itu hanya untuk endpoint yang
 *  memang ada di be-sada.
 * ============================================================================
 */

/** Ditulis literal supaya Next menggantinya jadi konstanta saat build. */
export const SHOW_DUMMY = process.env.NODE_ENV !== "production";

export type Notification = {
  id: string;
  title: string;
  body: string;
  /** Label waktu jadi; dummy tidak punya instant untuk dihitung. */
  timeLabel: string;
  isRead: boolean;
};

export const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "kas-keluar-menunggu",
    title: "Persetujuan kas keluar menunggu",
    body: "Rp 4.500.000 untuk konsumsi Natal Anak",
    timeLabel: "10 menit lalu",
    isRead: false,
  },
  {
    id: "jadwal-pelayan-kosong",
    title: "Jadwal pelayan belum lengkap",
    body: "Ibadah Minggu II: pemusik belum terisi",
    timeLabel: "1 jam lalu",
    isRead: false,
  },
  {
    id: "pengumuman-baru",
    title: "Pengumuman baru",
    body: "Rapat majelis Kamis pukul 19.00 di ruang konsistori",
    timeLabel: "Kemarin",
    isRead: true,
  },
];

/*
 * Widget dashboard yang endpoint-nya belum ada di be-sada
 * (dashboard-desktop.md §4 status B/X). Tanggal relatif terhadap hari ini
 * supaya fixture tidak basi.
 */

/** Pagu vs terpakai per komisi — dihitung internal `program.service.ts`, belum diekspos. */
export type BudgetUse = {
  id: string;
  commission: string;
  budget: number;
  used: number;
};

export const DUMMY_BUDGET_USE: BudgetUse[] = [
  {
    id: "b1",
    commission: "Komisi Pemuda",
    budget: 60_000_000,
    used: 51_600_000,
  },
  {
    id: "b2",
    commission: "Komisi Musik",
    budget: 25_000_000,
    used: 21_250_000,
  },
  {
    id: "b3",
    commission: "Komisi Wanita",
    budget: 40_000_000,
    used: 22_000_000,
  },
  { id: "b4", commission: "Komisi Anak", budget: 30_000_000, used: 9_300_000 },
];

/** Jemaat per wilayah — butuh route `jemaatByZone` (ada di service, tanpa route). */
export const DUMMY_ZONES = [
  { id: "w1", name: "Wilayah I", count: 312 },
  { id: "w2", name: "Wilayah II", count: 241 },
  { id: "w3", name: "Wilayah III", count: 198 },
  { id: "w4", name: "Wilayah IV", count: 174 },
  { id: "w5", name: "Wilayah V", count: 216 },
  { id: "w6", name: "Wilayah VI", count: 149 },
];

/** Jemaat baru bulan ini — `Jemaat.createdAt` bukan tanggal bergabung. */
export const DUMMY_NEW_MEMBERS = [
  {
    id: "n1",
    name: "Keluarga Sitompul",
    note: "Atestasi masuk",
    date: "2026-09-14",
  },
  {
    id: "n2",
    name: "Gabriella Panggabean",
    note: "Baptis dewasa",
    date: "2026-09-07",
  },
  {
    id: "n3",
    name: "Keluarga Nababan",
    note: "Atestasi masuk",
    date: "2026-09-02",
  },
];

/** Persembahan yang belum diposting ke jurnal — butuh hitungan dari be-sada. */
export const DUMMY_UNPOSTED_OFFERINGS = {
  title: "Persembahan 14–21 Sep",
  count: 23,
};

/** Saldo per rekening kas/bank — butuh penanda akun kas di be-sada (§10.1 #6). */
export const DUMMY_CASH_ACCOUNTS = [
  { id: "kas", name: "Kas besar", amount: 18_200_000 },
  { id: "bca", name: "BCA giro", amount: 214_000_000 },
  { id: "mandiri", name: "Mandiri", amount: 80_200_000 },
];

/** Bulan pengeluaran yang tertutup saldo ("runway"). */
export const DUMMY_CASH_RUNWAY_MONTHS = 4.1;

/** Cek tutup buku yang belum punya sumber data. */
export const DUMMY_CLOSING_CHECKS = [
  { id: "unposted", label: "23 persembahan belum diposting", isReady: false },
  { id: "settings", label: "Setelan akuntansi lengkap", isReady: true },
];
