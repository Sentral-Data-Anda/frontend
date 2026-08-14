/**
 * Identitas visual SADA — satu sumber untuk manifest, ikon, dan splash screen.
 *
 * Nilai warna di sini sengaja hex mentah, bukan variabel CSS. Manifest dan
 * `ImageResponse` dibaca di luar konteks CSS (browser saat memasang aplikasi,
 * Satori saat merender PNG), jadi keduanya tidak bisa membaca `oklch(...)`
 * dari globals.css. Angka di bawah adalah padanan sRGB dari token tema:
 *
 * | Token globals.css     | oklch             | hex di sini |
 * | --------------------- | ----------------- | ----------- |
 * | `--background`        | `oklch(1 0 0)`    | `#ffffff`   |
 * | `--background` (dark) | `oklch(0.145 0 0)`| `#0a0a0a`   |
 * | `--primary`           | `oklch(0.205 0 0)`| `#1a1a1a`   |
 * | `--primary-foreground`| `oklch(0.985 0 0)`| `#fafafa`   |
 *
 * Padanan dark background dibulatkan sedikit lebih gelap dari konversi persis
 * (~#0e0e0e) supaya menyatu dengan status bar gelap di Android. Bila token di
 * globals.css berubah, perbarui tabel dan nilai di bawah bersamaan.
 */
export const brand = {
  /** Latar splash screen Android saat aplikasi dibuka. Harus sama dengan latar app shell, kalau beda akan terlihat berkedip. */
  backgroundColor: "#ffffff",

  /** Warna titlebar window standalone desktop & status bar Android. Versi yang mengikuti tema ada di `viewport.themeColor` (src/app/layout.tsx). */
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },

  /** Warna ikon aplikasi. */
  icon: {
    background: "#1a1a1a",
    foreground: "#fafafa",
  },

  /**
   * Teks yang dirender sebagai ikon.
   *
   * INI PLACEHOLDER. Ikon SADA saat ini dihasilkan kode (lihat
   * src/app/icons/[icon]/route.tsx) karena belum ada aset logo. Begitu logo
   * asli tersedia, ganti route generator itu dengan berkas PNG statis di
   * `public/icons/` dan arahkan `src/app/manifest.ts` ke sana — ukuran,
   * `purpose`, dan aturan safe zone-nya sudah benar dan tidak perlu diubah.
   */
  wordmark: "SADA",
} as const;
