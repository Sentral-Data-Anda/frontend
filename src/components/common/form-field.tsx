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
   * SATU baris pesan, dan ruangnya disediakan sejak awal.
   *
   * Dulu petunjuk dan galat adalah dua `<p>` yang muncul-hilang, dan itu
   * punya akibat yang tidak terlihat sebagai masalah tampilan: pesan galat
   * yang menyisip MENGGESER seluruh isi di bawahnya. Kalau pergeseran itu
   * terjadi tepat di antara `mousedown` dan `mouseup` — persis yang terjadi
   * saat user meninggalkan field wajib lalu menekan kontrol di bawahnya —
   * `click` tidak pernah terbentuk dan tekanan pertama tertelan. Terukur di
   * ikon kalender, tapi ia akan memukul tautan, checkbox, dan tombol biasa
   * yang tidak punya jalan keluar lain.
   *
   * Karena itu: galat MENGGANTIKAN petunjuk (bukan menumpuk di bawahnya), dan
   * slotnya punya tinggi minimum satu baris walau kosong. Harganya satu baris
   * per field; yang dibeli adalah klik yang selalu mendarat.
   */
  const message = error ?? hint;
  const messageId = message
    ? `${htmlFor}-${error ? "error" : "hint"}`
    : undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-body font-medium">
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
      <p
        id={messageId}
        className={cn(
          "min-h-[1.125rem] text-caption",
          error
            ? "text-destructive text-body"
            : isHintWarning
              ? "border-warning bg-warning/10 rounded-control border px-2 py-1"
              : "text-muted-foreground",
        )}
      >
        {message}
      </p>
    </div>
  );
}
