/**
 * ============================================================================
 *  DATA DUMMY BERANDA — HAPUS SAAT DATA ASLI ADA
 * ============================================================================
 *
 *  Sumber data asli untuk dua bagian ini BELUM ADA:
 *
 *  - Kas gabungan / masuk / keluar: endpoint agregat (keputusan D20) dan
 *    modul Keuangan be-sada belum disiapkan. `/api/v1/report` hanya berisi
 *    laporan jemaat.
 *  - Notifikasi: modul notifikasi be-sada ditunda.
 *
 *  Karena itu keduanya HANYA dirender saat `SHOW_DUMMY` — di luar production.
 *  Di production kartu kas dan lonceng tidak muncul sama sekali (bukan "Rp 0",
 *  bukan placeholder). Angka palsu di layar bendahara lebih berbahaya daripada
 *  tidak ada angka.
 *
 *  Saat endpoint asli tersedia: hapus berkas ini, ganti impornya di
 *  `cash-summary-card.tsx` dan `notification-bell.tsx` dengan hook data, dan
 *  hapus kedua pemeriksaan `SHOW_DUMMY` di `home-screen.tsx`.
 *
 *  Tidak ditiru di `scripts/dev-mock.ts`: tiruan itu hanya untuk endpoint yang
 *  memang ada di be-sada.
 * ============================================================================
 */

/** Ditulis literal supaya Next menggantinya jadi konstanta saat build. */
export const SHOW_DUMMY = process.env.NODE_ENV !== "production";

export type CashSummary = {
  balance: number;
  income: number;
  expense: number;
};

export const DUMMY_CASH_SUMMARY: CashSummary = {
  balance: 248_560_000,
  income: 86_400_000,
  expense: 61_200_000,
};

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
