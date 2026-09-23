import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { FetchError } from "./api/fetcher";

/**
 * Galat simpan dari be-sada → galat di form. Dipakai SEMUA form, bukan hanya
 * jemaat: tiga jalur di bawah ini sama untuk 61 layar, dan menuliskannya
 * ulang per layar adalah cara satu layar diam-diam menelan galatnya.
 *
 * Urutannya sengaja: yang paling tepat sasaran didahulukan.
 *
 * 1. **`issues[]` dari server** — galat validasi per field. `path` bertitik
 *    sudah sebentuk dengan nama field react-hook-form, jadi diteruskan apa
 *    adanya. Ini jalur yang benar sejak be-sada mengirim `issues`.
 * 2. **Pesan unik yang dikenal fitur** — "Email Sudah Tersedia" dan kawannya
 *    datang dari pemeriksaan service, bukan dari validator, jadi ia tidak
 *    punya `path`. Fitur menyediakan pemetaannya lewat `mapMessage`.
 * 3. **Sisanya galat tingkat form** (`root`) — termasuk 500 dan galat
 *    jaringan. Menebak field untuk pesan yang tidak dikenal akan menyorot
 *    kotak yang tidak bersalah, dan user memperbaiki yang tidak salah.
 *
 * Isian tidak pernah dibuang: fungsi ini hanya menulis galat.
 */
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  mapMessage?: (message: string) => { field: string; message: string } | null,
): void {
  if (!(error instanceof FetchError)) {
    setError("root" as Path<T>, {
      message: "Tidak dapat menghubungi server. Periksa koneksi Anda.",
    });
    return;
  }

  if (error.issues.length > 0) {
    for (const issue of error.issues) {
      setError(issue.path as Path<T>, { message: issue.message });
    }
    return;
  }

  const mapped = mapMessage?.(error.message);

  setError((mapped?.field ?? "root") as Path<T>, {
    message: mapped?.message ?? error.message,
  });
}

/** Field pertama yang ditolak, untuk digulir ke pandangan setelah submit. */
export function firstErrorField(error: unknown): string | null {
  return error instanceof FetchError && error.issues.length > 0
    ? error.issues[0].path
    : null;
}
