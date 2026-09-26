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
      <dl className="divide-hairline divide-y @min-[36rem]/dl:grid @min-[36rem]/dl:grid-cols-2 @min-[36rem]/dl:gap-x-8 @min-[36rem]/dl:divide-y-0">
        {children}
      </dl>
    </div>
  );
};
