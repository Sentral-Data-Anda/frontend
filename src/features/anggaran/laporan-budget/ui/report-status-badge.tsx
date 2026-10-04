import { Badge } from "@/components/common/display";

import { reportStateLabel, reportStateOf, type ReportState } from "../model";
import type { BudgetReport, ReportApproval } from "../types";

const VARIANT: Record<ReportState, "draft" | "secondary" | "success"> = {
  DRAFT: "draft",
  PENDING_APPROVAL: "secondary",
  APPROVED: "success",
};

interface PropTypes {
  report: { status: BudgetReport["status"]; approval: ReportApproval | null };
}

export const ReportStatusBadge = (props: PropTypes) => {
  const { report } = props;

  return (
    <Badge variant={VARIANT[reportStateOf(report)]}>
      {reportStateLabel(report)}
    </Badge>
  );
};
