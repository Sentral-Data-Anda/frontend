import { TriangleAlert } from "lucide-react";

import { overEstimateText, type OverEstimate } from "../model";

interface PropTypes {
  over: OverEstimate | null;
  tail?: string;
}

export const OverEstimateAlert = (props: PropTypes) => {
  const { over, tail } = props;

  if (!over) return null;

  return (
    <p
      role="status"
      className="border-warning bg-warning/10 flex items-start gap-2 rounded-control border p-3 text-body"
    >
      <TriangleAlert
        aria-hidden
        className="text-warning-foreground mt-0.5 size-4 shrink-0"
      />
      <span>
        {tail ? `${overEstimateText(over)} ${tail}` : overEstimateText(over)}
      </span>
    </p>
  );
};
