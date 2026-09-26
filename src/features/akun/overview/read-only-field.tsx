import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  label: string;
  isStacked?: boolean;
  children: ReactNode;
}

export const ReadOnlyField = (props: PropTypes) => {
  const { label, isStacked = false, children } = props;

  return (
    <div
      className={cn(
        "py-2",
        isStacked ? "space-y-0.5" : "flex items-baseline justify-between gap-4",
      )}
    >
      <dt className="text-muted-foreground shrink-0 text-body">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-body font-medium break-words",
          !isStacked && "text-right",
        )}
      >
        {children}
      </dd>
    </div>
  );
};
