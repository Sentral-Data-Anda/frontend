/**
 * Identitas visual SADA — satu sumber untuk manifest, splash screen, dan
 * warna titlebar.
 *
 * Nilai warna di sini sengaja hex mentah, bukan variabel CSS. Manifest dibaca
 * browser di luar konteks CSS (saat memasang aplikasi, sebelum satu baris CSS
 * pun dimuat), jadi ia tidak bisa membaca `oklch(...)` dari globals.css.
 * Angka di bawah adalah padanan sRGB dari token tema:
 *
 * | Token globals.css     | nilai              | hex di sini |
 * | --------------------- | ------------------ | ----------- |
 * | `--canvas`            | primary-50         | `#f1f5f8`   |
 * | `--primary`           | primary-900        | `#364f6b`   |
 * | `--canvas` (dark)     | `oklch(0.145 0 0)` | `#0a0a0a`   |
 *
 * Padanan dark dibulatkan sedikit lebih gelap dari konversi persis (~#0e0e0e)
 * supaya menyatu dengan status bar gelap Android. Bila token di globals.css
 * berubah, perbarui tabel dan nilai di bawah bersamaan.
 */
export const brand = {
  /**
   * Biru SADA, diambil langsung dari latar aset logo resmi. Sama persis dengan
   * primary-900 di skala brand (`--primary` di globals.css).
   *
   * Belum dipakai sebagai `theme_color` karena permukaan atas app shell masih
   * putih — titlebar window standalone harus menyatu dengan apa yang ada di
   * bawahnya, bukan dengan warna logo. Dipakai saat app shell dibangun.
   */
  color: "#364f6b",

  /**
   * Latar splash screen Android saat aplikasi dibuka.
   *
   * Harus sama dengan latar app shell. Kalau berbeda, akan terlihat berkedip
   * pada momen splash berganti menjadi halaman.
   */
  backgroundColor: "#f1f5f8",

  /**
   * Warna titlebar window standalone desktop dan status bar Android.
   * Varian yang mengikuti tema ada di `viewport.themeColor`
   * (src/app/layout.tsx) — nilai di manifest statis dan hanya jadi fallback
   * saat aplikasi belum berjalan.
   */
  themeColor: {
    light: "#f1f5f8",
    dark: "#0a0a0a",
  },
} as const;
