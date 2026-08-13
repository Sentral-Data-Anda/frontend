import { env } from "@/lib/env";

/**
 * Error khusus API agar pemanggil bisa membedakan kegagalan jaringan/HTTP
 * dari error lain.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiClientOptions = Omit<RequestInit, "cache"> & {
  // Opsi caching Next.js (model "Previous"): ISR berbasis waktu + tag.
  next?: { revalidate?: number; tags?: string[] };
  cache?: RequestCache;
};

/**
 * Satu pintu masuk untuk semua panggilan ke API eksternal.
 * Mengurus base URL, header default, dan normalisasi error sekali saja.
 */
export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { headers, ...rest } = options;

  const response = await fetch(`${env.API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Permintaan ke "${path}" gagal: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}
