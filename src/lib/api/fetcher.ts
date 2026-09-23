import type { ApiListResponse, ApiResponse } from "@/types/api";

/**
 * Prefix seluruh panggilan dari browser.
 *
 * Relatif, bukan absolut ke be-sada. Yang menjawabnya adalah route handler di
 * `src/app/api/[...path]/route.ts`, yang meneruskannya ke be-sada di sisi
 * server. Itulah yang membuat cookie sesi jadi same-origin — lihat keputusan
 * D1 di dokumen desain.
 */
const BASE_PATH = "/api/v1";

/** Satu galat validasi per field, dari `issues[]` be-sada. */
export type ApiIssue = { path: string; message: string };

/** Kegagalan HTTP dari API, dengan pesan yang sudah layak ditampilkan. */
export class FetchError extends Error {
  readonly status: number;
  /**
   * Galat validasi PER FIELD, bila server mengirimnya.
   *
   * `path` bertitik (`additional.0.date`), bentuk yang sama dengan nama field
   * react-hook-form, jadi pemanggil bisa meneruskannya ke `setError` tanpa
   * menerjemahkan apa pun. Kosong berarti galat ini tidak menunjuk field —
   * dan galat semacam itu milik tingkat form, bukan ditebak-tebak.
   */
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

/**
 * be-sada menamai pesan galat `error`, sedangkan pesan sukses `message`.
 * Keduanya dicoba supaya perubahan di satu modul be-sada tidak memunculkan
 * "Permintaan gagal (400)" yang tidak menolong siapa pun.
 */
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
    // Badan bukan JSON — mis. halaman error dari reverse proxy. Jatuh ke
    // pesan default di bawah.
  }

  return { message: `Permintaan gagal (${response.status}).`, issues: [] };
};

const readErrorMessage = async (response: Response): Promise<string> =>
  (await readError(response)).message;

const onRequest = (path: string, init?: RequestInit): Promise<Response> =>
  fetch(`${BASE_PATH}${path}`, {
    ...init,
    headers: {
      // Hanya diisi bila memang ada badan. Mengirim Content-Type pada GET
      // membuat sebagian reverse proxy menganggapnya permintaan bertubuh.
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

/**
 * Satu record, atau satu operasi tulis.
 *
 * Mengembalikan amplop UTUH, bukan `data` saja: pemanggil sering butuh
 * `message` untuk notifikasi sukses, dan membuka satu lapis di sini berarti
 * setiap pemanggil harus menebak kedalaman datanya.
 */
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

/**
 * Daftar berpaginasi.
 *
 * be-sada membalas 404 ketika filter tidak menemukan apa pun. Bagi UI itu
 * keadaan normal yang menampilkan "tidak ada data", bukan layar error — jadi
 * penerjemahannya dilakukan SEKALI di sini, bukan di 61 layar. `status` yang
 * dikembalikan tetap 404 apa adanya; memalsukannya jadi 200 hanya menyulitkan
 * penelusuran nanti.
 *
 * Sengaja tidak berlaku untuk `fetchOne`: di sana 404 memang berarti record
 * yang diminta tidak ada.
 */
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
