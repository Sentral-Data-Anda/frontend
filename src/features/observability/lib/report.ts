/**
 * Pengirim laporan error dari browser ke `/api/observability`.
 *
 * Dipisah dari komponennya supaya bisa diuji sebagai fungsi murni.
 */

export type ClientErrorReport = {
  kind: "error" | "unhandledrejection";
  name: string;
  message: string;
  digest?: string;
  path?: string;
};

export const REPORT_ENDPOINT = "/api/observability";

/** Batas panjang pesan di sisi client, sebelum jaringan dipakai sia-sia. */
const MAX_MESSAGE_LENGTH = 1_000;

/**
 * Ubah apa pun yang dilempar menjadi laporan yang aman dikirim.
 *
 * `stack` SENGAJA tidak ikut: di browser ia memuat URL lengkap setiap frame,
 * termasuk query string halaman — yang bisa berisi id jemaat atau token.
 *
 * `path` diambil dari `location.pathname` saja, tanpa `search` dan `hash`,
 * dengan alasan yang sama.
 */
export function toReport(
  kind: ClientErrorReport["kind"],
  value: unknown,
  pathname: string,
): ClientErrorReport {
  if (value instanceof Error) {
    const digest = (value as Error & { digest?: string }).digest;

    return {
      kind,
      name: value.name,
      message: value.message.slice(0, MAX_MESSAGE_LENGTH),
      ...(digest ? { digest } : {}),
      path: pathname,
    };
  }

  return {
    kind,
    name: "UnknownError",
    message: String(value).slice(0, MAX_MESSAGE_LENGTH),
    path: pathname,
  };
}

/**
 * Kirim laporan tanpa menahan apa pun.
 *
 * `navigator.sendBeacon` dipakai lebih dulu karena ia tetap terkirim meski
 * halaman sedang ditutup — dan error fatal kerap diikuti user menutup tab.
 * `fetch` dengan `keepalive` menjadi cadangan.
 *
 * Kegagalan pengiriman ditelan sepenuhnya: pelapor error yang ikut melempar
 * error akan menciptakan loop, dan itu jauh lebih merusak daripada satu
 * laporan yang hilang.
 */
export function sendReport(report: ClientErrorReport): void {
  const body = JSON.stringify(report);

  try {
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(REPORT_ENDPOINT, blob)) {
        return;
      }
    }

    void fetch(REPORT_ENDPOINT, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Sengaja dibiarkan senyap. Lihat alasan di atas.
  }
}
