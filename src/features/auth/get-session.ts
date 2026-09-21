import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";

import { ApiError, apiClient } from "@/lib/api/client";
import type { ApiResponse } from "@/types/api";

import { sessionSchema, type Session } from "./types";

/**
 * Sesi user yang sedang masuk, beserta seluruh menu tree dan hak aksesnya.
 *
 * Satu panggilan, bukan dua: `authService.findUnique` di be-sada sudah
 * menggabungkan user dengan `menuService.findTree`.
 *
 * `:code` di path sengaja diisi "me". be-sada mengabaikannya dan bertindak
 * atas `req.user.code` — lihat komentar di `auth.controller.ts:55`. Cookie
 * `httpOnly`, jadi FE memang tidak punya cara membaca kode usernya sendiri,
 * dan tidak perlu.
 *
 * Dipanggil dari Server Component, jadi cookienya diteruskan manual: fetch di
 * server tidak membawa cookie permintaan masuk dengan sendirinya.
 *
 * Dibungkus `cache()`: `(app)/layout.tsx` dan halaman domain sama-sama
 * memanggilnya, dan keduanya harus berbagi satu `/auth/me` per request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Tanpa cookie tidak ada yang bisa ditanyakan, dan menembak API hanya untuk
  // menerima 401 berarti satu perjalanan bolak-balik pada setiap kunjungan
  // anonim.
  if (!cookieHeader) return null;

  try {
    const response = await apiClient<ApiResponse<Session>>("/v1/auth/me", {
      headers: { Cookie: cookieHeader },
      // Tidak ada opsi cache di sini, dan itu disengaja: apiClient memakai
      // "no-store" secara default, dan menggabungkan caching eksplisit dengan
      // header Cookie akan ditolak penjaganya sendiri.
      schema: z.object({
        status: z.number(),
        message: z.string(),
        data: sessionSchema,
      }),
    });

    return response.data;
  } catch (error) {
    // 401 adalah jawaban yang sah untuk "siapa yang sedang masuk?" — tidak
    // ada. Yang memutuskan apa yang terjadi berikutnya adalah pemanggil.
    if (
      error instanceof ApiError &&
      error.kind === "http" &&
      error.status === 401
    ) {
      return null;
    }

    throw error;
  }
});
