import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { FetchError } from "./api/fetcher";

export function applyServerError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  mapMessage?: (message: string) => { field: string; message: string } | null,
): string {
  if (!(error instanceof FetchError)) {
    setError("root" as Path<T>, {
      message: "Tidak dapat menghubungi server. Periksa koneksi Anda.",
    });
    return "root";
  }

  if (error.issues.length > 0) {
    for (const issue of error.issues) {
      setError(issue.path as Path<T>, { message: issue.message });
    }
    return error.issues[0].path;
  }

  const mapped = mapMessage?.(error.message);
  const field = mapped?.field ?? "root";

  setError(field as Path<T>, { message: mapped?.message ?? error.message });

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
