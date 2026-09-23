import { cloneElement, type ReactElement, type ReactNode } from "react";

export type FieldControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * Label + kontrol + petunjuk + galat untuk satu field.
 *
 * Label SELALU tampil di atas kontrol; placeholder tidak pernah menjadi label
 * (ia hilang begitu user mengetik, dan kontrasnya sengaja rendah).
 *
 * Kontrol di `children` menerima `id`, `aria-invalid`, dan `aria-describedby`
 * dari sini, jadi layar tidak bisa lupa menyambungkannya. `aria-invalid` dan
 * id galat hanya dipasang saat ada galat — pembaca layar tidak mengumumkan
 * "invalid" pada field yang belum pernah salah.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  /**
   * `ReactNode`, bukan `string`: form menandai yang OPSIONAL (bukan yang
   * wajib) dengan akhiran " (opsional)" berwarna pudar, dan itu satu elemen
   * di dalam label — bukan label kedua.
   */
  label: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactElement<FieldControlProps>;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-body font-medium">
        {label}
      </label>

      {cloneElement(children, {
        id: htmlFor,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}

      {hint ? (
        <p id={hintId} className="text-muted-foreground text-caption">
          {hint}
        </p>
      ) : null}

      {error ? (
        // Tanpa role="alert": beberapa field bisa invalid bersamaan (submit
        // dengan semuanya kosong), dan alert ganda yang meletup serentak
        // sebelum user sempat pindah fokus lebih berisik daripada menolong.
        // aria-describedby sudah cukup — pembaca layar membaca pesan ini
        // begitu fokus mendarat di kontrol yang aria-invalid. role="alert"
        // hanya milik galat root form (mis. kredensial ditolak server).
        <p id={errorId} className="text-destructive text-body">
          {error}
        </p>
      ) : null}
    </div>
  );
}
