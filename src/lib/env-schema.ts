import { z } from "zod";

// Dibaca dua kali: saat build oleh vite.config.ts (gagal lebih awal), dan saat
// aplikasi dimuat oleh lib/env.ts. VITE_* di-inline ke bundel ketika build.
export const clientEnvSchema = z.object({
  VITE_SITE_URL: z.url({ error: "VITE_SITE_URL wajib berupa URL" }),
  VITE_ENABLE_SW: z
    .string()
    .optional()
    .transform((value) => value === "1"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
