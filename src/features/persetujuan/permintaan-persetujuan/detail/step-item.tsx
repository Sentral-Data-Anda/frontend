import { Badge } from "@/components/common/display";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { STEP_STATE_LABEL, STEP_STATE_VARIANT, approverLabel } from "../model";
import type { ApprovalStep, StepState } from "../types";

interface PropTypes {
  step: ApprovalStep;
  position: number;
  state: StepState;
  isLast: boolean;
}

export const StepItem = (props: PropTypes) => {
  const { step, position, state, isLast } = props;

  const isCurrent = state === "waiting";

  return (
    <li
      aria-current={isCurrent ? "step" : undefined}
      className={cn("relative flex gap-3", !isLast && "pb-5")}
    >
      {isLast ? null : (
        <span
          aria-hidden
          className="bg-border absolute top-8 bottom-1 left-3.5 w-px -translate-x-1/2"
        />
      )}

      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-semibold tabular-nums",
          isCurrent
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {position}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="min-w-0 text-body font-medium break-words">
            <span className="sr-only">Tahap {position}: </span>
            {approverLabel(step)}
          </p>
          <Badge variant={STEP_STATE_VARIANT[state]}>
            {STEP_STATE_LABEL[state]}
          </Badge>
        </div>

        {step.actedAt ? (
          <p className="text-muted-foreground mt-0.5 text-caption">
            {[formatDateTime(step.actedAt), step.actor?.name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}

        {step.note ? (
          <blockquote className="bg-muted mt-2 max-w-prose rounded-control px-3 py-2 text-body break-words">
            <span className="sr-only">Alasan penolakan: </span>
            {step.note}
          </blockquote>
        ) : null}
      </div>
    </li>
  );
};
