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
