import { Badge } from "@/components/common/display";

import { runStatusText } from "../model";
import { RUN_STATUS_LABEL, type Run } from "../types";

interface PropTypes {
  run: Pick<Run, "status" | "updatedAt">;
  isCompact?: boolean;
}

export const RunStatus = (props: PropTypes) => {
  const { run, isCompact = false } = props;

  return (
    <Badge
      variant={run.status === "POSTED" ? "success" : "draft"}
      className="pr-0.5"
    >
      {isCompact ? RUN_STATUS_LABEL[run.status] : runStatusText(run)}
    </Badge>
  );
};
