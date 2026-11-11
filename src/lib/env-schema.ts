import { z } from "zod";

// Dibaca dua kali: saat build oleh vite.config.ts (gagal lebih awal), dan saat
// aplikasi dimuat oleh lib/env.ts. VITE_* di-inline ke bundel ketika build.
const isIanaZone = (zone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

// Jam dinding gereja, harus sama dengan APP_TIMEZONE milik be-sada. Kosong =
// Asia/Jakarta, seperti bawaan be-sada.
export const appTimezoneSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() || "Asia/Jakarta")
  .refine(isIanaZone, {
    error: "VITE_APP_TIMEZONE harus nama zona waktu IANA, contoh Asia/Jakarta",
  });

export const clientEnvSchema = z.object({
  VITE_SITE_URL: z.url({ error: "VITE_SITE_URL wajib berupa URL" }),
  VITE_ENABLE_SW: z
    .string()
    .optional()
    .transform((value) => value === "1"),
  VITE_APP_TIMEZONE: appTimezoneSchema,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
