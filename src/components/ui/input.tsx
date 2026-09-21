import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Teks 12px (`text-body`) seperti isi lainnya — auto-zoom iOS dicegah
// `maximumScale` di src/app/layout.tsx, bukan dengan font 16px.
// Keputusan user: tampilan input SAMA sebelum dan saat diketik — tidak ada
// border, ring, atau perubahan latar saat fokus. Satu-satunya penanda fokus
// adalah caret. Konsekuensi yang diterima: tidak memenuhi WCAG 2.4.7 (fokus
// terlihat) untuk pengguna keyboard, dan varian `filled` tanpa garis tidak
// memenuhi 1.4.11 (batas kontrol ≥3:1). Label selalu tampil di atas field.
// Invalid ditandai latar `destructive/10` + pesan galat di bawah field.
const inputVariants = cva(
  "h-control w-full min-w-0 px-2.5 py-1 text-body transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive/10 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
  {
    variants: {
      variant: {
        // Batas penuh 1px `--input` (≥3:1 terhadap latar, WCAG 1.4.11).
        outline:
          "rounded-control border border-input bg-transparent disabled:bg-muted",
        // Bidang abu tanpa garis, seperti mockup.
        filled: "rounded-control border-0 bg-input-fill",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

function Input({
  className,
  type,
  variant,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
