import { queryOptions } from "@tanstack/react-query";

import { apiFetch, readFailure } from "@/lib/api/fetcher";

import { sessionSchema, type Session } from "./types";

const ME_PATH = "/auth/me";

const toSession = async (response: Response): Promise<Session | null> => {
  if (response.status === 401) return null;

  if (!response.ok) throw await readFailure(response, ME_PATH);

  const body = (await response.json()) as { data: unknown };

  return sessionSchema.parse(body.data);
};

export const SESSION_QUERY_KEY = ["auth", "session"] as const;

// Sekali per muatan halaman, seperti layout server dulu. Login, logout, dan
// refresh() menggantinya.
export const sessionQuery = queryOptions({
  queryKey: SESSION_QUERY_KEY,
  queryFn: async () => toSession(await apiFetch(ME_PATH)),
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
});

/**
 * Sesi tanpa mencoba refresh, untuk /login: pengunjung yang belum masuk tidak
 * perlu menghabiskan jatah refresh-token be-sada.
 */
export const peekSession = async (): Promise<Session | null> =>
  toSession(await fetch(`/api/v1${ME_PATH}`, { cache: "no-store" }));
