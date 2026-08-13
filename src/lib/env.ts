/**
 * Guard server-only.
 *
 * Paket "server-only" membuat modul ini GAGAL DI-BUNDLE — bukan cuma gagal
 * saat runtime — begitu ada kode ber-"use client" yang mengimpornya, langsung
 * dan transitif. Kesalahannya muncul saat `next build`, jauh sebelum ada
 * variabel server yang sempat terkirim ke browser pengguna.
 */
import "server-only";
import { z } from "zod";

/**
 * Validasi environment variable saat modul dimuat — fail-fast: proses gagal
 * start jika variabel wajib belum di-set, alih-alih menyala diam-diam dengan
 * konfigurasi yang salah (mis. menembak API_BASE_URL default ke
 * localhost:3001 di production karena lupa di-set).
 *
 * Karena itu TIDAK ADA `.default()` di sini. Nilai untuk pengembangan lokal
 * ditaruh di `.env.example`/`.env.local`, bukan dibekukan di kode.
 *
 * Dipisah dua kelompok:
 * - `env` — variabel privat server. Bukan prefiks NEXT_PUBLIC_, sehingga
 *   dibaca dari process.env saat runtime (bukan di-inline saat build) —
 *   bisa diganti lewat env Docker tanpa build ulang. TIDAK PERNAH boleh
 *   diekspos ke client; guard di atas memastikan modul ini sendiri tidak
 *   bisa tertarik ke bundle browser.
 * - `publicEnv` — variabel yang memang publik. Prefiks NEXT_PUBLIC_ membuat
 *   Next meng-inline nilainya ke bundle browser saat `next build`, sehingga
 *   nilainya beku sejak saat itu (image yang sama tidak bisa dipromosikan
 *   ke environment lain tanpa build ulang). Divalidasi di sini untuk dipakai
 *   dari kode server (metadata, robots.ts); kode client yang butuh nilai ini
 *   membacanya langsung lewat `process.env.NEXT_PUBLIC_SITE_URL`, bukan
 *   dengan mengimpor modul ini — modul ini server-only.
 */
const serverEnvSchema = z.object({
  API_BASE_URL: z.url(),
});

export const env = serverEnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
