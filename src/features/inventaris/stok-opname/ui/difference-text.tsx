import { cn } from "@/lib/utils";

import { differenceLabel, differenceTone } from "../model";

interface PropTypes {
  difference: number | null;
  className?: string;
}

export const DifferenceText = (props: PropTypes) => {
  const { difference, className } = props;

  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        difference === null
          ? "text-muted-foreground"
          : differenceTone(difference),
        className,
      )}
    >
      {difference === null ? "—" : differenceLabel(difference)}
    </span>
  );
};
