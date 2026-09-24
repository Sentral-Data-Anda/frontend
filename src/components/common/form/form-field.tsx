import { cloneElement, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  isHintWarning = false,
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
  /**
   * Petunjuk yang berubah menjadi PERINGATAN (mis. "kode induk diubah →
   * username ikut berubah"). Tetap `hint`, bukan `error`: isiannya sah dan
   * form tetap boleh disimpan — yang berubah hanya nada, supaya akibatnya
   * terbaca tanpa menghalangi. Tetap ikut `aria-describedby`.
   *
   * Nadanya WARNING, bukan destructive: merah adalah bahasa "ini salah, tidak
   * bisa dilanjutkan", dan di sini tidak ada yang salah. Bentuknya disamakan
   * dengan peringatan kembaran di layar yang sama — satu bahasa untuk
   * "perhatikan ini", bukan dua.
   */
  isHintWarning?: boolean;
  children: ReactElement<FieldControlProps>;
}) {
  /**
   * Satu pesan: galat MENGGANTIKAN petunjuk, bukan menumpuk di bawahnya —
   * karena itu pesan galat wajib berdiri sendiri (membawa contoh atau akibat
   * yang tadinya ada di petunjuk).
   *
   * Pesan hanya memakan ruang BILA ADA. Slot bertinggi tetap sempat dipakai
   * untuk mencegah galat yang menyisip menggeser kontrol di bawahnya di
   * antara `mousedown` dan `mouseup`, tapi slot kosong 22px membuat jarak
   * antar-field tidak rata (field tanpa petunjuk berjarak jauh, field
   * berpetunjuk sesak). Masalah pergeseran kini diselesaikan di sumbernya:
   * form memvalidasi saat SUBMIT (`mode: "onSubmit"`), jadi tidak ada galat
   * yang muncul saat sebuah field ditinggalkan — saat galat muncul, kliknya
   * sudah selesai.
   *
   * Ritme: label → kontrol 6px, kontrol → pesan 6px. Jarak ke field
   * berikutnya milik pembungkusnya (`FormSection`, form login), bukan milik
   * field ini — supaya tidak ada jarak ganda.
   */
  const message = error ?? hint;
  const messageId = message
    ? `${htmlFor}-${error ? "error" : "hint"}`
    : undefined;

  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-body font-medium">
        {label}
      </label>

      {cloneElement(children, {
        id: htmlFor,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": messageId,
      })}

      {/*
        Tanpa role="alert": beberapa field bisa invalid bersamaan (submit
        dengan semuanya kosong), dan alert ganda yang meletup serentak sebelum
        user sempat pindah fokus lebih berisik daripada menolong.
        aria-describedby sudah cukup — pembaca layar membaca pesan ini begitu
        fokus mendarat di kontrol yang aria-invalid. role="alert" hanya milik
        galat tingkat form.
      */}
      {message ? (
        <p
          id={messageId}
          className={cn(
            "mt-1.5 text-caption",
            error
              ? "text-destructive text-body"
              : isHintWarning
                ? "border-warning bg-warning/10 rounded-control border px-2 py-0.5"
                : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
