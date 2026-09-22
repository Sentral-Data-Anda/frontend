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
 * Dashboard (Beranda): 1152px di ≥ lg supaya muat tiga kolom di samping
 * sidebar; < lg sama dengan `shellWidth` (tumpuk). Lihat
 * `docs/design/dashboard-desktop.md` §3a.
 */
export const shellWidthWide = "mx-auto w-full md:max-w-2xl lg:max-w-6xl";
