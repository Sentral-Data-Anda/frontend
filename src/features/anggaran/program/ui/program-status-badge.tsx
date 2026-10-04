import { Badge } from "@/components/common/display";

import { programStateLabel, programStateOf, type ProgramState } from "../model";
import type { Program, ProgramApproval } from "../types";

const VARIANT: Record<
  ProgramState,
  "draft" | "secondary" | "success" | "neutral"
> = {
  DRAFT: "draft",
  PENDING_APPROVAL: "secondary",
  APPROVED: "success",
  CANCELLED: "neutral",
};

interface PropTypes {
  program: { status: Program["status"]; approval: ProgramApproval | null };
}

export const ProgramStatusBadge = (props: PropTypes) => {
  const { program } = props;

  return (
    <Badge variant={VARIANT[programStateOf(program)]}>
      {programStateLabel(program)}
    </Badge>
  );
};
