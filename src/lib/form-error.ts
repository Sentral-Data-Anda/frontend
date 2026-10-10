import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { FetchError, fallbackMessage } from "./api/fetcher";
import { showToast } from "./toast-bus";

const OFFLINE_MESSAGE = "Tidak dapat menghubungi server. Periksa koneksi Anda.";

export const FORBIDDEN_MESSAGE =
  "Anda tidak memiliki izin untuk melakukan tindakan ini.";

const isBareForbidden = (error: FetchError) =>
  error.status === 403 &&
  error.code === null &&
  error.message === fallbackMessage(403);

// Galat yang tidak terpetakan ke field tampil lewat FormAlert di dalam aliran
// dokumen, yang bisa berada di luar layar karena tombol simpan menempel di
// bawah viewport. Toast menjaga kegagalannya tetap terlihat di posisi gulir
// mana pun; FormAlert-nya tetap ada supaya pesannya bisa dibaca ulang.
export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  mapMessage?: (message: string) => { field: string; message: string } | null,
): string {
  if (!(error instanceof FetchError)) {
    setError("root" as Path<T>, { message: OFFLINE_MESSAGE });
    showToast({ title: OFFLINE_MESSAGE, type: "error" });
    return "root";
  }

  if (error.issues.length > 0) {
    for (const issue of error.issues) {
      const message = mapMessage?.(issue.message)?.message ?? issue.message;

      setError(issue.path as Path<T>, { message });
    }
    return error.issues[0].path;
  }

  if (isBareForbidden(error)) {
    setError("root" as Path<T>, { message: FORBIDDEN_MESSAGE });
    showToast({ title: FORBIDDEN_MESSAGE, type: "error" });
    return "root";
  }

  const mapped = mapMessage?.(error.message);
  const field = mapped?.field ?? "root";

  const message = mapped?.message ?? error.message;

  setError(field as Path<T>, { message });

  if (field === "root") showToast({ title: message, type: "error" });

  return field;
}

// Galat validasi klien: field bergalat pertama menurut urutan DOM, bukan urutan skema.
export const FIRST_INVALID = "*";

export function revealField(field: string | null | undefined): void {
  if (!field) return;

  const control =
    field === FIRST_INVALID
      ? document.querySelector<HTMLElement>('form [aria-invalid="true"]')
      : document.getElementById(field);

  if (!control) return;

  control.focus({ preventScroll: true });
  control.scrollIntoView({ block: "center", behavior: "smooth" });
}
