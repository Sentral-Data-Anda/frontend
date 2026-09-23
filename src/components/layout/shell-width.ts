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
 * Dashboard (Beranda): MENGISI lebar layar, tanpa batas atas (keputusan user
 * 2026-09-23: "isi mengikuti lebar layar sampai habis, hanya disisakan jarak
 * tepi"; menggantikan batas 100rem/1600px). Jarak tepinya tetap gutter
 * halaman, sama seperti layar lain.
 *
 * Yang menjaga keterbacaan bukan lagi batas lebar melainkan jumlah kolom:
 * `DashboardGrid` menambah kolom kartu saat kolom konten melebar (2 → 3 → 4),
 * jadi kartu tetap ~360–520px berapa pun lebarnya. < lg sama dengan
 * `shellWidth` (tumpuk). Lihat `docs/design/dashboard-desktop.md` §10.5.
 */
export const shellWidthDashboard = "mx-auto w-full md:max-w-2xl lg:max-w-none";

/**
 * Layar kerja — isian (`FormLayout`) dan daftar bertabel (Daftar Jemaat):
 * lebar konten yang sama dengan layar lain (penuh di HP, 672px di tablet),
 * lalu di desktop mengisi kolom konten seperti dashboard — dengan batas
 * 1152px supaya satu field di grid dua kolom tidak melar lewat ±420px
 * (form-pattern.md §12). Daftar dan formnya memakai kolom yang SAMA, jadi
 * berpindah di antara keduanya tidak menggeser tepi halaman.
 */
export const shellWidthWide = "mx-auto w-full md:max-w-2xl lg:max-w-6xl";
