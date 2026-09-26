import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PropTypes {
  className?: string;
  children: ReactNode;
}

export const DescriptionList = (props: PropTypes) => {
  const { className, children } = props;

  return (
    <div className={cn("@container/dl", className)}>
      <dl className="divide-hairline divide-y @min-[30rem]/dl:grid @min-[30rem]/dl:grid-cols-2 @min-[30rem]/dl:gap-x-8 @min-[30rem]/dl:divide-y-0 @min-[64rem]/dl:grid-cols-4">
        {children}
      </dl>
    </div>
  );
};
