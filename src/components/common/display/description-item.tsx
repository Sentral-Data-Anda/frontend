import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  label: string;
  isStacked?: boolean;
  isWide?: boolean;
  children: ReactNode;
}

export const DescriptionItem = (props: PropTypes) => {
  const { label, isStacked = false, isWide = false, children } = props;

  return (
    <div
      className={cn(
        "py-2 @min-[30rem]/dl:block @min-[30rem]/dl:space-y-0.5",
        isStacked ? "space-y-0.5" : "flex items-baseline justify-between gap-4",
        isWide && "@min-[30rem]/dl:col-span-full",
      )}
    >
      <dt className="text-muted-foreground shrink-0 text-body">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-body font-medium break-words",
          !isStacked && "text-right @min-[30rem]/dl:text-left",
        )}
      >
        {children}
      </dd>
    </div>
  );
};
