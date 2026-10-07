import { UsersRound } from "lucide-react";

import { cn } from "@/lib/utils";

interface PropTypes {
  label: string;
  variant?: "person" | "group";
}

export const Avatar = (props: PropTypes) => {
  const { label, variant = "person" } = props;

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        "bg-primary-200 text-body font-semibold text-primary-900",
      )}
    >
      {variant === "group" ? (
        <UsersRound data-slot="avatar-group-icon" className="size-4.5" />
      ) : (
        label.trim().charAt(0).toUpperCase() || "?"
      )}
    </span>
  );
};
