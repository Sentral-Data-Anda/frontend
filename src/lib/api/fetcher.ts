import type { ApiListResponse, ApiResponse } from "@/types/api";

import { refreshSession, withRefreshLock } from "./refresh";
import { endSession } from "./session";

const BASE_PATH = "/api/v1";

export type ApiIssue = { path: string; message: string };

export class FetchError extends Error {
  readonly status: number;
  readonly issues: ApiIssue[];
  readonly code: string | null;

  constructor(
    status: number,
    message: string,
    issues: ApiIssue[] = [],
    code: string | null = null,
  ) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.issues = issues;
    this.code = code;
  }
}

const readIssues = (body: Record<string, unknown>): ApiIssue[] =>
  Array.isArray(body.issues)
    ? body.issues.filter(
        (issue): issue is ApiIssue =>
          typeof issue === "object" &&
          issue !== null &&
          typeof (issue as ApiIssue).path === "string" &&
          typeof (issue as ApiIssue).message === "string",
      )
    : [];

export const fallbackMessage = (status: number): string =>
  `Permintaan gagal (${status}).`;

const readError = async (
  response: Response,
): Promise<{ message: string; issues: ApiIssue[]; code: string | null }> => {
  let issues: ApiIssue[] = [];
  let code: string | null = null;

  try {
    const body: unknown = await response.json();

    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;

      issues = readIssues(record);
      code = typeof record.code === "string" ? record.code : null;

      if (typeof record.error === "string") {
        return { message: record.error, issues, code };
      }
      if (typeof record.message === "string") {
        return { message: record.message, issues, code };
      }
    }
  } catch {
    // Badan bukan JSON: pakai pesan bawaan.
  }

  return { message: fallbackMessage(response.status), issues, code };
};

const send = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${BASE_PATH}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

// Tiga endpoint ini mengurus sesinya sendiri: mengulangnya sesudah refresh
// menyodorkan lagi id yang baru saja dipakai.
const SESSION_PATHS = new Set([
  "/auth/login",
  "/auth/refresh-token",
  "/auth/logout",
]);

/**
 * Permintaan ke be-sada. 401 diberi satu kesempatan di bawah kunci refresh:
 * ulang dulu (tab lain mungkin sudah merotasi), baru refresh, lalu ulang sekali.
 * 401 yang tersisa dikembalikan apa adanya.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await send(path, init);

  if (response.status !== 401 || SESSION_PATHS.has(path)) return response;

  await response.body?.cancel().catch(() => {});

  return withRefreshLock(async () => {
    const retried = await send(path, init);

    if (retried.status !== 401) return retried;

    if (!(await refreshSession())) return retried;

    await retried.body?.cancel().catch(() => {});

    return send(path, init);
  });
}

// 401 dari login berarti kredensial salah, bukan sesi yang berakhir.
const isCredentialRejection = (path: string) => path === "/auth/login";

export const readFailure = async (response: Response, path: string) => {
  const failure = await readError(response);

  if (response.status === 401 && !isCredentialRejection(path)) {
    endSession();
  }

  return new FetchError(
    response.status,
    failure.message,
    failure.issues,
    failure.code,
  );
};

export async function fetchOne<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await apiFetch(path, init);

  if (!response.ok) throw await readFailure(response, path);

  return response.json() as Promise<ApiResponse<T>>;
}

export async function fetchList<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiListResponse<T>> {
  const response = await apiFetch(path, init);

  if (!response.ok) throw await readFailure(response, path);

  return response.json() as Promise<ApiListResponse<T>>;
}

const FILE_NAME = /filename="?([^";]+)"?/i;

/**
 * Berkas dari be-sada (mis. ekspor CSV yang di-stream). Gagal dibaca seperti
 * `fetchOne`: pesan be-sada menjadi `FetchError`, dan 401 mengakhiri sesi.
 */
export async function fetchFile(
  path: string,
  fallbackName: string,
  init?: RequestInit,
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiFetch(path, init);

  if (!response.ok) throw await readFailure(response, path);

  const disposition = response.headers.get("content-disposition") ?? "";

  return {
    blob: await response.blob(),
    fileName: FILE_NAME.exec(disposition)?.[1] ?? fallbackName,
  };
}

/** Menyimpan berkas ke perangkat pengguna lewat unduhan peramban. */
export function saveFile(file: { blob: Blob; fileName: string }): void {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = file.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Setelah klik, bukan seketika: Safari membatalkan unduhan yang URL-nya
  // dicabut di tick yang sama.
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
