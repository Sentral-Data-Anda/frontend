import type { ComponentProps } from "react";

import { inputVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

interface PropTypes extends ComponentProps<"textarea"> {}

export const Textarea = (props: PropTypes) => {
  const { className, rows = 3, ...rest } = props;

  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        inputVariants({ variant: "outline" }),
        "field-sizing-content h-auto min-h-16 resize-y py-1.5",
        className,
      )}
      {...rest}
    />
  );
};
