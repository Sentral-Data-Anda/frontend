import { cn } from "@/lib/utils";

interface PropTypes {
  time: string;
  highlighted?: boolean;
}

export const TimeBadge = (props: PropTypes) => {
  const { time, highlighted = false } = props;

  const [hour, minute = "00"] = time.split(":");

  return (
    <span
      className={cn(
        "flex size-10 shrink-0 flex-col items-center justify-center rounded-control text-body leading-tight font-semibold tabular-nums",
        highlighted && "bg-primary-100",
      )}
    >
      <span aria-hidden>{hour}</span>
      <span aria-hidden>.{minute}</span>
      <span className="sr-only">
        {hour}.{minute}
      </span>
    </span>
  );
};
