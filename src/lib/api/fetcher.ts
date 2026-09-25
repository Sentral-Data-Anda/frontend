import type { ApiListResponse, ApiResponse } from "@/types/api";

const BASE_PATH = "/api/v1";

export type ApiIssue = { path: string; message: string };

export class FetchError extends Error {
  readonly status: number;
  readonly issues: ApiIssue[];

  constructor(status: number, message: string, issues: ApiIssue[] = []) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.issues = issues;
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

const readError = async (
  response: Response,
): Promise<{ message: string; issues: ApiIssue[] }> => {
  try {
    const body: unknown = await response.json();

    if (body && typeof body === "object") {
      const record = body as Record<string, unknown>;
      const issues = readIssues(record);

      if (typeof record.error === "string") {
        return { message: record.error, issues };
      }
      if (typeof record.message === "string") {
        return { message: record.message, issues };
      }
    }
  } catch {
    // Badan bukan JSON: pakai pesan bawaan.
  }

  return { message: `Permintaan gagal (${response.status}).`, issues: [] };
};

const readErrorMessage = async (response: Response): Promise<string> =>
  (await readError(response)).message;

const onRequest = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${BASE_PATH}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

export async function fetchOne<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await onRequest(path, init);

  if (!response.ok) {
    const failure = await readError(response);

    throw new FetchError(response.status, failure.message, failure.issues);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

export async function fetchList<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiListResponse<T>> {
  const response = await onRequest(path, init);

  if (response.status === 404) {
    return {
      status: 404,
      message: await readErrorMessage(response),
      data: [],
      totalData: 0,
      totalPage: 0,
    };
  }

  if (!response.ok) {
    throw new FetchError(response.status, await readErrorMessage(response));
  }

  return response.json() as Promise<ApiListResponse<T>>;
}
