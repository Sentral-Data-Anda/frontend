import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Teks 12px (`text-body`) seperti isi lainnya — auto-zoom iOS dicegah
// `maximumScale` di src/app/layout.tsx, bukan dengan font 16px.
// Fokus (keputusan user 2026-09-22, menggantikan "penanda fokus hanya
// caret"): garis tepi berubah NAVY (`--primary`, primary-900) — tetap 1px,
// tanpa ring, warna bidang tidak berubah. Navy vs garis `--input` (p500)
// terbaca jelas, dan navy 8.44:1 terhadap putih, jadi WCAG 2.4.7/1.4.11
// terpenuhi. Varian `filled` mendapat garis transparan 1px supaya garis navy
// yang sama muncul saat fokus tanpa menggeser isi. Label selalu tampil di
// atas field. Invalid ditandai latar `destructive/10` + pesan galat di bawah
// field (garis invalid menang atas garis fokus).
const inputVariants = cva(
  "h-control w-full min-w-0 px-2.5 py-1 text-body transition-colors outline-none focus-visible:border-primary file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive/10 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
  {
    variants: {
      variant: {
        // Batas penuh 1px `--input` (≥3:1 terhadap latar, WCAG 1.4.11).
        outline:
          "rounded-control border border-input bg-card disabled:bg-primary-100",
        // Bidang abu tanpa garis, seperti mockup.
        filled: "rounded-control border border-transparent bg-input-fill",
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
