import type { ZodType } from "zod";

import { env } from "@/lib/env";

export type ApiErrorKind = "http" | "timeout" | "network" | "validation";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = options?.status;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;

type ApiClientOptions<T = unknown> = Omit<RequestInit, "cache"> & {
  next?: { revalidate?: number; tags?: string[] };
  cache?: RequestCache;
  timeoutMs?: number | null;
  schema?: ZodType<T>;
};

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions<T> = {},
): Promise<T> {
  const {
    headers,
    next,
    cache,
    schema,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
    ...rest
  } = options;

  const timeoutSignal =
    timeoutMs === null ? undefined : AbortSignal.timeout(timeoutMs);
  const signal =
    callerSignal && timeoutSignal
      ? AbortSignal.any([callerSignal, timeoutSignal])
      : (callerSignal ?? timeoutSignal);

  const hasExplicitCaching =
    cache !== undefined ||
    next?.revalidate !== undefined ||
    (next?.tags?.length ?? 0) > 0;

  if (hasExplicitCaching && cache !== "no-store") {
    const headerNames = new Set(
      Object.keys(
        headers instanceof Headers
          ? Object.fromEntries(headers.entries())
          : Array.isArray(headers)
            ? Object.fromEntries(headers)
            : (headers ?? {}),
      ).map((name) => name.toLowerCase()),
    );

    const credentialHeader = ["authorization", "cookie"].find((name) =>
      headerNames.has(name),
    );

    if (credentialHeader) {
      throw new ApiError(
        "validation",
        `Panggilan ke "${path}" menggabungkan caching eksplisit dengan header "${credentialHeader}". ` +
          "Respons terautentikasi tidak boleh masuk Data Cache Next — kuncinya URL, bukan user, " +
          "sehingga data satu user akan tersaji ke user lain. Buang opsi cache/next, atau panggil " +
          "endpoint ini tanpa kredensial bila datanya memang publik.",
      );
    }

    if (rest.credentials === "include") {
      throw new ApiError(
        "validation",
        `Panggilan ke "${path}" menggabungkan caching eksplisit dengan credentials: "include". ` +
          "Alasannya sama seperti di atas: Data Cache Next tidak per-user.",
      );
    }
  }

  let response: Response;
  try {
    response = await fetch(`${env.API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      next,
      cache: hasExplicitCaching ? cache : "no-store",
      signal,
    });
  } catch (error) {
    if (callerSignal?.aborted) {
      throw error;
    }

    if (timeoutSignal?.aborted) {
      throw new ApiError(
        "timeout",
        `Permintaan ke "${path}" melewati batas waktu ${timeoutMs}ms.`,
        { cause: error },
      );
    }

    throw new ApiError(
      "network",
      `Permintaan ke "${path}" gagal sebelum mendapat respons: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "http",
      `Permintaan ke "${path}" gagal: ${response.status} ${response.statusText}`,
      { status: response.status },
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    if (callerSignal?.aborted) {
      throw error;
    }

    if (timeoutSignal?.aborted) {
      throw new ApiError(
        "timeout",
        `Permintaan ke "${path}" melewati batas waktu ${timeoutMs}ms saat membaca badan respons.`,
        { cause: error },
      );
    }

    throw new ApiError(
      "validation",
      `Respons dari "${path}" bukan JSON yang valid.`,
      { cause: error },
    );
  }

  if (!schema) {
    return json as T;
  }

  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    throw new ApiError(
      "validation",
      `Respons dari "${path}" tidak sesuai schema yang diharapkan.`,
      { cause: parsed.error },
    );
  }

  return parsed.data;
}
