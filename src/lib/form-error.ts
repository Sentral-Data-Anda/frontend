import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { FetchError } from "./api/fetcher";

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

export function firstErrorField(error: unknown): string | null {
  return error instanceof FetchError && error.issues.length > 0
    ? error.issues[0].path
    : null;
}
