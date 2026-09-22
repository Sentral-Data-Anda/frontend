/**
 * Lebar kolom konten. Milik shell, bukan milik layar: penuh di HP, lalu
 * dibatasi supaya baris daftar setinggi 56px tidak direntangkan ke 1440px
 * dan menyisakan lautan kosong antara nama dan badge statusnya.
 *
 * Berkas sendiri, bukan ekspor dari `app-shell.tsx`: halaman error adalah
 * Client Component, dan mengimpor app-shell dari sana ikut menyeret sidebar
 * dan bottom tab ke bundelnya. Dipakai `AppShell` dan halaman di luar `(app)`
 * (error, 404, offline) supaya lebar kolomnya satu sumber.
 */
export const shellWidth = "mx-auto w-full md:max-w-2xl lg:max-w-3xl";

/**
 * Dashboard (Beranda): di ≥ lg MENGISI kolom konten — sidebar penuh maupun
 * rail (permintaan user 2026-09-22: ruang kosong di kiri/kanan saat rail
 * "jelek bgt"). Batas atas 100rem (1600px) hanya terasa di layar ≥ ~1690px:
 * di 1920 + rail kolom tetap 1600px, supaya tabel dan grafik tidak melar
 * (baris tabel ~1000px di kolom utama). < lg sama dengan `shellWidth`
 * (tumpuk). Lihat `docs/design/dashboard-desktop.md` §10.5.
 */
export const shellWidthDashboard = "mx-auto w-full md:max-w-2xl lg:max-w-400";
