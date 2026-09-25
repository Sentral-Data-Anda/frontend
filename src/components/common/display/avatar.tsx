import { cn } from "@/lib/utils";

interface PropTypes {
  label: string;
}

export const Avatar = (props: PropTypes) => {
  const { label } = props;

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        "bg-primary-200 text-body font-semibold text-primary-900",
      )}
    >
      {label.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
};
