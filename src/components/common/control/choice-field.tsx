"use client";

import { cn } from "@/lib/utils";

import type { SelectOption } from "./select-field";

interface PropTypes {
  id: string;
  label: string;
  isLabelVisible?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  disabled?: boolean;
  error?: string;
  hint?: string;
  // Disuntikkan `FormField` lewat `cloneElement`. Tanpa menerimanya di sini,
  // keduanya hilang: grup tidak pernah terbaca salah, dan `aria-describedby`
  // menunjuk id pesan galat yang tidak terpasang ke apa pun.
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const ChoiceField = (props: PropTypes) => {
  const {
    id,
    label,
    isLabelVisible = true,
    value,
    onValueChange,
    options,
    disabled,
    error,
    hint,
    "aria-invalid": invalidProp,
    "aria-describedby": describedByProp,
  } = props;

  const message = error ?? hint;
  const messageId = message ? `${id}-${error ? "error" : "hint"}` : undefined;
  const isInvalid = invalidProp ?? (error ? true : undefined);
  const describedBy = messageId ?? describedByProp;

  return (
    <div className="@container">
      <fieldset id={id} aria-describedby={describedBy}>
        <legend
          className={cn(
            "mb-1.5 text-body font-medium",
            !isLabelVisible && "sr-only",
          )}
        >
          {label}
        </legend>

        <div className={TRACK}>
          {options.map((option, index) => (
            <label key={option.value} className={CHOICE}>
              <input
                type="radio"
                // `aria-invalid` ke pilihan PERTAMA saja, seperti
                // `CheckboxGroupField`: di elemen non-form ia tidak diumumkan,
                // dan di SETIAP pilihan ia menandai yang benar sebagai salah.
                //
                // `id` TETAP di fieldset-nya, TIDAK dipindah ke radio pertama
                // seperti `CheckboxGroupField`. Bedanya: komponen itu merender
                // pesannya sendiri, sedangkan ini dipakai di dalam `FormField`
                // yang punya `<label for>` sendiri — radio dengan `id` itu jadi
                // punya dua label, dan nama pilihannya ("Menunggu saya")
                // tertimpa nama grupnya. Tesnya menangkap ini.
                aria-invalid={index === 0 ? isInvalid : undefined}
                name={id}
                value={option.value}
                checked={value === option.value}
                disabled={disabled}
                onChange={() => onValueChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {message ? (
        <p
          id={messageId}
          className={cn(
            "mt-1.5",
            error
              ? "text-destructive text-body"
              : "text-muted-foreground text-caption",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
};

const TRACK =
  "bg-muted has-aria-invalid:bg-destructive/10 has-aria-invalid:ring-destructive flex w-full gap-0.5 rounded-control p-0.5 has-aria-invalid:ring-1 @min-[48rem]:w-fit";

// TANPA `whitespace-nowrap`, dan itu disengaja: pilihan di sini `flex-1
// min-w-0`, jadi label yang tidak muat akan MELUBER keluar track-nya alih-alih
// membungkus — terpotong di tepi layar, dengan halaman yang tidak menggulir,
// jadi tidak ada gejala yang terlihat dan `getBoundingClientRect` pun tidak
// melaporkannya (pedoman §7.3). Membungkus dua baris itu jawabannya, bukan
// cacatnya. Jangan "merapikannya" kembali ke satu baris.
const CHOICE =
  "text-muted-foreground hover:text-foreground has-checked:bg-card has-checked:text-foreground has-focus-visible:ring-ring has-disabled:hover:text-muted-foreground flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-[calc(var(--radius-control)-2px)] px-2 text-center text-body font-medium transition-colors select-none has-checked:shadow-sm has-focus-visible:ring-2 has-disabled:cursor-not-allowed has-disabled:opacity-50 @min-[48rem]:flex-none @min-[48rem]:px-4";
