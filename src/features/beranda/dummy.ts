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

/** Jadwal pelayanan saya — butuh `GET /jadwal-pelayan/saya`. */
export type MyDuty = {
  id: string;
  /** Hari dari hari ini. */
  inDays: number;
  time: string;
  service: string;
  role: string;
};

export const DUMMY_MY_DUTIES: MyDuty[] = [
  {
    id: "d1",
    inDays: 5,
    time: "08:00",
    service: "Ibadah Minggu I",
    role: "Pemusik",
  },
  {
    id: "d2",
    inDays: 12,
    time: "17:00",
    service: "Ibadah Minggu II",
    role: "Lektor",
  },
  {
    id: "d3",
    inDays: 19,
    time: "08:00",
    service: "Ibadah Minggu I",
    role: "Pemusik",
  },
];

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

/** Kesiapan pembukuan — gabungan periode fiskal + setelan akuntansi (isu I9). */
export type BookkeepingCheck = { id: string; label: string; isReady: boolean };

export const DUMMY_BOOKKEEPING: BookkeepingCheck[] = [
  { id: "k1", label: "Periode bulan ini terbuka", isReady: true },
  { id: "k2", label: "Setelan akun kas & bank lengkap", isReady: false },
  { id: "k3", label: "Jurnal bulan lalu diposting", isReady: true },
];
