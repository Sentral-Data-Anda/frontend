import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  aside: ReactNode;
  className?: string;
  children: ReactNode;
}

export const AsideLayout = (props: PropTypes) => {
  const { aside, className, children } = props;

  return (
    <div className={cn("@container/aside", className)}>
      <div className="space-y-4 @min-[60rem]/aside:grid @min-[60rem]/aside:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] @min-[60rem]/aside:items-start @min-[60rem]/aside:gap-4 @min-[60rem]/aside:space-y-0">
        <div className="min-w-0">{children}</div>
        <div className="min-w-0 space-y-4">{aside}</div>
      </div>
    </div>
  );
};
