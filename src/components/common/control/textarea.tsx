import type { ComponentProps } from "react";

import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
