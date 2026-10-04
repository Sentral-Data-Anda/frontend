import { Badge } from "@/components/common/display";
import { COMPLIANCE_STATE_LABEL, type ComplianceState } from "@/types/anggaran";

const VARIANT: Record<
  ComplianceState,
  "success" | "draft" | "warning" | "neutral" | "secondary"
> = {
  APPROVED: "success",
  DRAFT: "draft",
  MISSING: "warning",
  NOT_DUE: "neutral",
  WAIVED: "secondary",
};

interface PropTypes {
  state: ComplianceState;
}

export const PendingBadge = (props: PropTypes) => {
  const { state } = props;

  return (
    <Badge variant={VARIANT[state]}>{COMPLIANCE_STATE_LABEL[state]}</Badge>
  );
};
