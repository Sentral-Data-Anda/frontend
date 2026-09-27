import { PANEL_TITLE, Panel } from "@/components/common/display";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { stepStateOf } from "../model";
import type { ApprovalRequest } from "../types";

import { StepItem } from "./step-item";

interface PropTypes {
  request: ApprovalRequest;
}

export const StepTimeline = (props: PropTypes) => {
  const { request } = props;

  return (
    <Panel label="Tahapan">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Tahapan</h2>

      <ol className="px-gutter pt-3 pb-4">
        {request.steps.map((step, index) => (
          <StepItem
            key={step.publicId}
            step={step}
            position={index + 1}
            state={stepStateOf(request, step)}
            isLast={index === request.steps.length - 1}
          />
        ))}
      </ol>

      {request.status === "CANCELLED" && request.completedAt ? (
        <p className="border-hairline text-muted-foreground border-t px-gutter py-3 text-body">
          Ditarik pengaju · {formatDateTime(request.completedAt)}
        </p>
      ) : null}
    </Panel>
  );
};
