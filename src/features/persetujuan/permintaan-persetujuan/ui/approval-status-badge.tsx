import { Badge } from "@/components/common/display";
import {
  APPROVAL_STATUS_LABEL,
  type ApprovalStatus,
} from "@/types/persetujuan";

import { STATUS_VARIANT } from "../model";

interface PropTypes {
  status: ApprovalStatus;
}

export const ApprovalStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {APPROVAL_STATUS_LABEL[status]}
    </Badge>
  );
};
