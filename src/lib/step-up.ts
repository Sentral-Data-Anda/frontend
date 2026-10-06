import { z } from "zod";

import { FetchError, fetchOne } from "./api/fetcher";

/**
 * `middleware/stepUp.ts` be-sada menjawab 403 ber-`code: "STEP_UP_REQUIRED"`.
 * Hari ini ia menjaga Persembahan; di fase SDM ia menjaga setiap bacaan gaji
 * (\u00a72.4 lapis 2). Jadi detektor, skema, dan panggilannya hidup di lapis
 * BERSAMA, bukan di `features/akun` \u2014 `features/sdm` tidak boleh
 * mengimpornya dari fitur lain (eslint `boundaries/dependencies`).
 */
export const isStepUpRequired = (error: unknown): boolean =>
  error instanceof FetchError && error.code === "STEP_UP_REQUIRED";

export const verifyPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Mohon lengkapi password")
    .max(25, "Password maksimal 25 karakter"),
});

export type VerifyPasswordValues = z.infer<typeof verifyPasswordSchema>;

export type StepUpGrant = { expiresAt: string };

// Bukan useMutation: variables mutasi (password) tertahan di MutationCache.
export const verifyPassword = (password: string) =>
  fetchOne<StepUpGrant>("/auth/verify-password", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
