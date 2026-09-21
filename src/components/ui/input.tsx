import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Teks 12px (`text-body`) seperti isi lainnya — auto-zoom iOS dicegah
// `maximumScale` di src/app/layout.tsx, bukan dengan font 16px.
// Fokus TANPA border dan ring (keputusan user). Indikator fokus (WCAG 2.4.7)
// adalah latar yang naik ke `input-fill-active` sekaligus hilangnya garis
// `--input`. Garis `--input` di keadaan diam tetap ada — itu batas kontrol
// yang lolos 1.4.11. Invalid: garis `destructive` saat diam, latar
// `destructive/10` saat fokus.
const inputVariants = cva(
  "h-control w-full min-w-0 px-2.5 py-1 text-body transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:bg-input-fill-active disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:bg-destructive/10 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
  {
    variants: {
      variant: {
        // Batas penuh 1px `--input` (≥3:1 terhadap latar, WCAG 1.4.11).
        outline:
          "rounded-control border border-input bg-transparent disabled:bg-muted",
        // Pola Material "filled": bidang abu, hanya garis bawah.
        filled:
          "rounded-t-control rounded-b-none border-0 border-b border-input bg-input-fill",
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
