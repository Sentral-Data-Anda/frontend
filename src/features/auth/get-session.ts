import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";

import { ApiError, apiClient } from "@/lib/api/client";
import { pickSessionCookies } from "@/lib/api/cookie";
import type { ApiResponse } from "@/types/api";

import { sessionSchema, type Session } from "./types";

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const cookieHeader = pickSessionCookies(cookieStore.toString());

  if (!cookieHeader) return null;

  try {
    const response = await apiClient<ApiResponse<Session>>("/v1/auth/me", {
      headers: { Cookie: cookieHeader },
      schema: z.object({
        status: z.number(),
        message: z.string(),
        data: sessionSchema,
      }),
    });

    return response.data;
  } catch (error) {
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
