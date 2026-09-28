import { quotaTextOf } from "../model";
import type { EventOption } from "../types";

interface PropTypes {
  event: EventOption;
}

export const QuotaSummary = (props: PropTypes) => {
  const { event } = props;

  return (
    <p
      aria-live="polite"
      className="text-muted-foreground px-gutter pb-3 text-body tabular-nums"
    >
      {quotaTextOf(event)}
    </p>
  );
};
