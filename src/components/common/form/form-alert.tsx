import { Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

interface PropTypes {
  title: string;
  message: string;
  tone?: "error" | "info";
}

export const FormAlert = (props: PropTypes) => {
  const { title, message, tone = "error" } = props;

  const isInfo = tone === "info";
  const Icon = isInfo ? Info : TriangleAlert;
  const textTone = isInfo ? "text-foreground" : "text-destructive";

  return (
    <div
      role={isInfo ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-control border p-3",
        isInfo
          ? "border-border bg-card"
          : "border-destructive bg-destructive/10",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          isInfo ? "text-muted-foreground" : "text-destructive",
        )}
        aria-hidden
      />

      <div className="min-w-0">
        <p className={cn("text-body font-medium", textTone)}>{title}</p>
        <p className={cn("text-body", textTone)}>{message}</p>
      </div>
    </div>
  );
};
