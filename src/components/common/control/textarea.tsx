import type { ComponentProps } from "react";

import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Isian beberapa baris, dengan gaya yang sama persis dengan `Input`.
 *
 * Alamat Indonesia hampir selalu dua sampai tiga baris (jalan, RT/RW, blok,
 * patokan). Di kotak satu baris, apa yang sudah diketik menggulir keluar
 * pandangan justru saat petugas memeriksa ulang ejaannya.
 *
 * `h-control` dari `inputVariants` dibatalkan — tinggi di sini diatur `rows`.
 */
export function Textarea({
  className,
  rows = 3,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        inputVariants({ variant: "outline" }),
        "field-sizing-content h-auto min-h-16 resize-y py-1.5",
        className,
      )}
      {...props}
    />
  );
}
