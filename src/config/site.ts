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
 */
export const siteConfig = {
  name: "Sentral Data Anda",
  shortName: "SADA",
  description:
    "Sentral Data Anda (SADA) — aplikasi pengelolaan data dan pelayanan jemaat GKI Graha Raya.",
  ogImage: "/og-image.png",
  contact: {
    address: "Jl. Contoh Alamat No. 1, Graha Raya, Tangerang",
    phone: "+62 21 0000 0000",
    email: "sekretariat@gkigraharaya.org",
    mapsUrl: "https://maps.google.com/?q=GKI+Graha+Raya",
  },
  links: {
    instagram: "https://instagram.com/gkigraharaya",
    youtube: "https://youtube.com/@gkigraharaya",
    facebook: "https://facebook.com/gkigraharaya",
  },
} as const;

export type SiteConfig = typeof siteConfig;
