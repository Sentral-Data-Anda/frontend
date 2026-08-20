/**
 * Identitas situs dipusatkan di sini agar tidak hardcode bertebaran.
 *
 * Berkas ini SENGAJA tidak menyentuh process.env sama sekali. Berkas ini
 * diimpor oleh komponen client (Logo → SiteHeader ber-"use client"), jadi
 * apa pun yang ada di sini otomatis ikut ke bundle browser. Sebelumnya
 * `url` diisi dari `process.env.SITE_URL` langsung di sini — di browser
 * variabel non-NEXT_PUBLIC_ itu selalu undefined, sehingga diam-diam selalu
 * jatuh ke fallback hardcode, dan production yang benar sekalipun tetap
 * menampilkan URL yang salah pada apa pun yang dirender di client.
 *
 * Nilai URL situs sekarang satu-satunya sumber kebenarannya ada di
 * src/lib/env.ts (`publicEnv.NEXT_PUBLIC_SITE_URL`), dipakai langsung oleh
 * berkas server yang butuh (app/layout.tsx untuk metadata) — bukan lewat
 * siteConfig — supaya rantai impor dari komponen client tidak pernah
 * menyentuh env sama sekali.
 *
 * Yang sudah dibuang dari sini, dan alasannya:
 *
 * - `contact` (alamat, telepon, email, mapsUrl) dan `links` (instagram,
 *   youtube, facebook). Itu identitas situs profil gereja, bukan aplikasi
 *   terautentikasi. Semuanya masih berisi nilai contoh ("Jl. Contoh Alamat
 *   No. 1", "+62 21 0000 0000") dan `links` bahkan tidak pernah dipakai
 *   satu komponen pun. Tempatnya di project situs profil yang terpisah.
 * - `ogImage`. Menunjuk ke /og-image.png yang BERKASNYA TIDAK ADA di
 *   public/, dan tidak pernah dibaca oleh metadata mana pun — jadi referensi
 *   mati yang menyesatkan. SADA ada di balik login; tautannya tidak
 *   dibagikan ke publik, jadi tidak ada yang perlu dipulihkan di sini.
 */
export const siteConfig = {
  name: "Sentral Data Anda",
  shortName: "SADA",
  description:
    "Sentral Data Anda (SADA) — aplikasi pengelolaan data dan pelayanan jemaat GKI Graha Raya.",
} as const;

export type SiteConfig = typeof siteConfig;
