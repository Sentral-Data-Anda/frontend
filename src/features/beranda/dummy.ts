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
