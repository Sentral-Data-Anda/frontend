import type { ZodType } from "zod";

import { env } from "@/lib/env";

/**
 * Error khusus API agar pemanggil bisa membedakan kegagalan jaringan/HTTP
 * dari error lain.
 *
 * `kind` menunjuk titik kegagalan secara spesifik supaya pemanggil bisa
 * memutuskan penanganan yang berbeda (mis. retry untuk timeout, redirect ke
 * halaman login untuk HTTP 401, log ke layanan pemantauan untuk validasi
 * gagal):
 * - "http"       — server merespons dengan status non-2xx
 * - "timeout"    — permintaan dibatalkan karena melewati batas waktu (lihat
 *                  `timeoutMs`), BUKAN karena pemanggil sendiri yang
 *                  membatalkan (lihat pembahasan di `apiClient`)
 * - "network"    — fetch gagal sebelum sempat mendapat respons apa pun
 *                  (DNS, koneksi putus, sertifikat TLS, dst.)
 * - "validation" — respons diterima dengan status OK tapi bodinya bukan
 *                  JSON valid, atau bentuknya tidak sesuai schema Zod yang
 *                  diberikan pemanggil
 */
export type ApiErrorKind = "http" | "timeout" | "network" | "validation";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Hanya terisi untuk kind "http". */
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

/**
 * Batas waktu default satu panggilan API, dalam milidetik. Cukup longgar
 * untuk koneksi jemaat yang lambat, cukup ketat agar Server Component tidak
 * menggantung sampai batas platform saat satu API downstream macet.
 */
const DEFAULT_TIMEOUT_MS = 10_000;

type ApiClientOptions<T = unknown> = Omit<RequestInit, "cache"> & {
  // Opsi caching Next.js (model "Previous"): ISR berbasis waktu + tag.
  // Ini BUKAN opsi default — lihat catatan keamanan cache di bawah.
  next?: { revalidate?: number; tags?: string[] };
  cache?: RequestCache;
  /**
   * Batas waktu permintaan dalam milidetik. Default: `DEFAULT_TIMEOUT_MS`.
   *
   * `null` mematikan timeout sepenuhnya. Satu-satunya alasan sah untuk itu
   * adalah memulihkan request memoization Next — lihat catatan MEMOIZATION di
   * dokumentasi `apiClient` di bawah sebelum memakainya.
   */
  timeoutMs?: number | null;
  /**
   * Schema Zod opsional. Bila diisi, body respons divalidasi lewat
   * `schema.safeParse` sebelum dikembalikan ke pemanggil; kegagalan
   * melempar `ApiError` berkind "validation" tepat di batas jaringan,
   * bukan meledak jauh di kedalaman render karena field yang diasumsikan
   * ada ternyata tidak ada.
   *
   * Opsional secara sengaja: pemanggil yang belum sempat menulis schema
   * tetap bisa memakai client ini seperti biasa (lihat cabang tanpa
   * schema di bawah).
   */
  schema?: ZodType<T>;
};

/**
 * Satu pintu masuk untuk semua panggilan ke API eksternal SADA.
 * Mengurus base URL, header default, timeout, normalisasi error, dan
 * (opsional) validasi bentuk respons — sekali saja, di satu tempat.
 *
 * === KEAMANAN CACHE (baca sebelum mengubah default di bawah) ===
 * SADA adalah aplikasi terautentikasi — apa pun yang lewat client ini
 * berpotensi data jemaat. Default `fetch` Next.js versi ini adalah
 * "auto no cache": pada route yang TIDAK memakai Request-time API (belum
 * memanggil `cookies()`/`headers()` dsb.), Next tetap boleh mem-prerender
 * route itu secara statis saat `next build` dan menyajikan HASIL FETCH SAAT
 * BUILD ITU ke SEMUA user (lihat
 * node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md,
 * bagian `options.cache`). Untuk client yang membawa data terautentikasi,
 * itu berarti data user A bisa tersaji ke user B — persis kelas bug yang
 * disebut di desain arsitektur SADA (D6/D7): "Semua data terautentikasi
 * memakai cache: 'no-store' tanpa pengecualian."
 *
 * Karena itu default di sini adalah `cache: "no-store"` EKSPLISIT, bukan
 * mengandalkan default Next yang bisa berubah tergantung bentuk route.
 *
 * Opt-in caching (mis. untuk endpoint yang memang publik/tidak-personal,
 * seperti jadwal pelayan) hanya aktif bila pemanggil eksplisit memberi
 * `cache` ATAU `next.revalidate`/`next.tags` — itu keputusan sadar
 * pemanggil per panggilan, bukan default client ini. Jangan mengeset
 * `cache: "no-store"` BERSAMAAN dengan `next.revalidate` pada satu
 * panggilan yang sama; Next.js mengabaikan keduanya bila dua opsi itu
 * bertabrakan (lihat "Good to know" di dokumen fetch.md di atas) — karena
 * itu, ketika pemanggil memberi `next.revalidate`/`next.tags` tanpa
 * `cache` eksplisit, `cache` sengaja TIDAK diisi "no-store" di sini.
 *
 * Kombinasi caching eksplisit + header Authorization/Cookie ditolak di kode
 * (bukan cuma dilarang di komentar) — lihat penjaga di badan fungsi.
 *
 * === MEMOIZATION (konsekuensi dari timeout — baca sebelum heran) ===
 * fetch.md, bagian Memoization: "fetch requests using GET with the same URL
 * and options are automatically memoized during a server render pass...
 * To opt out, pass an AbortController signal to fetch."
 *
 * Timeout di sini diimplementasikan lewat AbortSignal, jadi setiap panggilan
 * `apiClient` OTOMATIS keluar dari memoization itu. Konsekuensinya nyata:
 * bila `(app)/layout.tsx` dan `(app)/page.tsx` sama-sama memanggil
 * `apiClient("/me")` dalam satu render pass, backend menerima dua request
 * identik, bukan satu. Efeknya berlipat pada layar yang punya banyak segmen.
 *
 * Trade-off ini diambil sadar: request yang menggantung tanpa batas lebih
 * merugikan daripada request ganda. Dua jalan keluar bila duplikasinya
 * terasa:
 * - bungkus service-nya dengan `React.cache` supaya dedup terjadi di lapisan
 *   service (ini cara yang dianjurkan untuk endpoint yang dipanggil dari
 *   lebih dari satu segmen), atau
 * - lewatkan `timeoutMs: null` pada panggilan itu untuk mengembalikan
 *   memoization bawaan Next, dengan sadar melepas perlindungan timeout.
 */
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

  // Timeout diimplementasikan lewat AbortSignal, digabung dengan signal
  // milik pemanggil (jika ada) lewat AbortSignal.any — pembatalan dari
  // kedua sisi tetap dihormati. Di blok catch di bawah kita bedakan siapa
  // yang membatalkan lewat status masing-masing signal, supaya "pemanggil
  // membatalkan" tidak ikut dilaporkan sebagai ApiError kind "timeout".
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

  // Penjaga D6/D7 — larangan ini harus hidup sebagai kode, bukan cuma sebagai
  // komentar. Data Cache Next berkunci URL + opsi fetch, BUKAN per-user, jadi
  // menggabungkan caching eksplisit dengan kredensial berarti respons user A
  // tersaji ke user B selama jendela revalidate. Itu persis kelas bug yang
  // disebut di desain arsitektur SADA.
  //
  // Dilempar tanpa memandang NODE_ENV: kombinasi ini tidak pernah benar, dan
  // membiarkannya lolos di production adalah kebocoran data, bukan sekadar
  // ketidaknyamanan pengembangan.
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
      // Pembatalan disengaja oleh pemanggil (mis. navigasi berpindah
      // sebelum request selesai) — teruskan error abort aslinya apa
      // adanya, ini bukan kegagalan API yang perlu ditangani sebagai
      // ApiError.
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
    // Header respons sudah diterima, tapi badannya bisa saja masih mengalir
    // saat signal menyala. Pembedaan yang sama seperti pada catch fetch di
    // atas HARUS diulang di sini — tanpa ini, timeout dan pembatalan oleh
    // pemanggil yang terjadi di tengah pembacaan badan sama-sama keluar
    // sebagai kind "validation", sehingga retry-on-timeout milik pemanggil
    // tidak pernah menyala dan navigasi yang dibatalkan user memunculkan
    // error boundary.
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
    // Tanpa schema: perilaku lama dipertahankan (type assertion, bukan
    // validasi runtime). Pemanggil yang butuh jaminan bentuk data mengisi
    // opsi `schema` di atas.
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
