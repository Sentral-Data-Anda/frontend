import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

interface PropTypes {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  isCompact?: boolean;
  className?: string;
}

export const EmptyState = (props: PropTypes) => {
  const {
    title = "Belum ada data",
    description,
    action,
    isCompact = false,
    className,
  } = props;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        isCompact && "px-2.5 pt-4 pb-2",
        className,
      )}
    >
      <Inbox
        className={cn(
          "text-muted-foreground mb-3 size-8",
          isCompact && "text-border mb-2 size-6",
        )}
        strokeWidth={isCompact ? 1.4 : 2}
        aria-hidden
      />

      <p
        className={cn(
          "text-body font-medium",
          isCompact && "text-muted-foreground max-w-60 font-normal",
        )}
      >
        {title}
      </p>

      {description ? (
        <p className="text-muted-foreground mt-1 max-w-xs text-body text-balance">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};
