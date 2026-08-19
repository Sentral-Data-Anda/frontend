/**
 * Penyaring data sensitif sebelum apa pun masuk log.
 *
 * Ini bagian terpenting dari observability di SADA, dan alasannya spesifik:
 * isi aplikasi ini adalah data jemaat. Log yang bocor lebih buruk daripada
 * tidak ada log sama sekali — ia menyalin data pribadi ke tempat yang retensi
 * dan hak aksesnya berbeda dari basis data, biasanya tanpa ada yang sadar.
 *
 * Semua fungsi di sini murni, supaya bisa diuji.
 */

/**
 * Header yang tidak pernah boleh muncul di log.
 *
 * Ditandai `[redacted]` alih-alih dibuang, supaya saat menyelidiki insiden
 * masih terlihat bahwa header itu ADA — sering kali "apakah request ini
 * membawa kredensial" justru pertanyaan pertamanya.
 */
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-nonce",
  "x-api-key",
]);

/**
 * Header yang boleh dicatat apa adanya.
 *
 * Daftar putih, bukan daftar hitam: header yang belum dikenal ikut dibuang.
 * Header baru bisa muncul kapan saja dari proxy, CDN, atau load balancer, dan
 * asumsi amannya adalah "tidak dicatat sampai ada yang memutuskan sebaliknya".
 *
 * `referer` sengaja TIDAK ada di sini — nilainya kerap membawa query string
 * dari halaman sebelumnya.
 */
const SAFE_HEADERS = new Set([
  "user-agent",
  "accept-language",
  "content-type",
  "x-forwarded-proto",
]);

export type RedactedHeaders = Record<string, string>;

export function redactHeaders(
  headers: Record<string, string | string[] | undefined>,
): RedactedHeaders {
  const result: RedactedHeaders = {};

  for (const [rawName, rawValue] of Object.entries(headers)) {
    const name = rawName.toLowerCase();

    if (SENSITIVE_HEADERS.has(name)) {
      result[name] = "[redacted]";
      continue;
    }

    if (!SAFE_HEADERS.has(name) || rawValue === undefined) {
      continue;
    }

    result[name] = Array.isArray(rawValue) ? rawValue.join(", ") : rawValue;
  }

  return result;
}

/**
 * Buang query string dari path.
 *
 * Query bisa membawa token reset kata sandi, id jemaat, atau kata kunci
 * pencarian yang berisi nama orang. Path-nya sendiri sudah cukup untuk tahu
 * rute mana yang bermasalah.
 */
export function redactPath(path: string): string {
  const cut = path.search(/[?#]/);
  return cut === -1 ? path : path.slice(0, cut);
}

/** Batas panjang pesan error yang dicatat. */
export const MAX_MESSAGE_LENGTH = 500;

export function truncate(
  value: string,
  max: number = MAX_MESSAGE_LENGTH,
): string {
  return value.length <= max ? value : `${value.slice(0, max)}…[dipotong]`;
}

export type RedactedError = {
  name: string;
  message: string;
  digest?: string;
};

/**
 * Ubah error menjadi bentuk yang aman dicatat.
 *
 * `cause` SENGAJA tidak ikut. Pada `apiClient`, kegagalan validasi Zod
 * menyimpan `parsed.error` di `cause`, dan objek itu memuat NILAI DATA yang
 * ditolak — yaitu isi respons API, yaitu data jemaat. Mencatat `cause` berarti
 * menyalin data itu ke log setiap kali bentuk respons berubah.
 *
 * `stack` juga tidak ikut untuk error dari client: di browser ia bisa memuat
 * URL lengkap beserta query.
 */
export function redactError(error: unknown): RedactedError {
  if (error instanceof Error) {
    const digest = (error as Error & { digest?: string }).digest;

    return {
      name: error.name,
      message: truncate(error.message),
      ...(digest ? { digest } : {}),
    };
  }

  return { name: "UnknownError", message: truncate(String(error)) };
}
