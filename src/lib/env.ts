import { z } from "zod";

/**
 * Validasi environment variable saat modul dimuat (fail-fast).
 * API_BASE_URL bersifat server-only (bukan NEXT_PUBLIC_) sehingga dibaca saat
 * runtime — bisa diganti di Docker tanpa build ulang.
 */
const envSchema = z.object({
  API_BASE_URL: z.url().default("http://localhost:3001/api"),
  SITE_URL: z.url().default("http://localhost:3000"),
});

export const env = envSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  SITE_URL: process.env.SITE_URL,
});
