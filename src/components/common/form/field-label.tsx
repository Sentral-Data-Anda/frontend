import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  htmlFor: string;
  className?: string;
  isRequired?: boolean;
  children: ReactNode;
}

// One place owns how a field says "wajib". The asterisk sits outside the
// <label> so it stays out of the field's name; aria-required carries the
// meaning for a screen reader.
export const FieldLabel = (props: PropTypes) => {
  const { htmlFor, className, isRequired = false, children } = props;

  return (
    <span className={cn(className, "flex items-baseline gap-0.5")}>
      <label htmlFor={htmlFor}>{children}</label>
      {isRequired ? (
        <>
          <span aria-hidden className="text-destructive">
            *
          </span>
          <span className="sr-only">wajib</span>
        </>
      ) : null}
    </span>
  );
};
