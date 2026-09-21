import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// Tinggi h-11 (44px): target sentuh minimum iOS. `text-base` di SEMUA ukuran,
// bukan hanya mobile: Safari memperbesar halaman saat memfokus input ber-font
// <16px, dan iPad (≥768px) ikut kena — `md:text-sm` bawaan shadcn dibuang
// karena itu.
const inputVariants = cva(
  "h-11 w-full min-w-0 px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        // Batas penuh 1px `--input` (≥3:1 terhadap latar, WCAG 1.4.11).
        outline:
          "rounded-lg border border-input bg-transparent focus-visible:border-ring disabled:bg-muted",
        // Pola Material "filled": bidang abu, hanya garis bawah. Saat fokus
        // garisnya menjadi 2px `--primary` — 1px border + 1px inset shadow,
        // supaya teks di dalamnya tidak bergeser 1px seperti kalau
        // `border-b-2` yang dipakai.
        filled:
          "rounded-t-lg rounded-b-none border-0 border-b border-input bg-input-fill focus-visible:border-primary focus-visible:shadow-[inset_0_-1px_0_var(--primary)] aria-invalid:shadow-[inset_0_-1px_0_var(--destructive)]",
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
