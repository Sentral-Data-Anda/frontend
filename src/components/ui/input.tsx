import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "h-control w-full min-w-0 px-2.5 py-1 text-body transition-colors outline-none focus-visible:border-primary [&[readonly]]:cursor-default [&[readonly]]:bg-muted file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-body file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:bg-destructive/10 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-2 aria-invalid:focus-visible:ring-ring dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
  {
    variants: {
      variant: {
        outline:
          "rounded-control border border-input bg-card disabled:bg-primary-100",
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
