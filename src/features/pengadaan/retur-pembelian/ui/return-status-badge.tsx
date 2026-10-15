import { Badge } from "@/components/common/display";

import { RETURN_STATUS_VARIANT } from "../model";
import { RETURN_STATUS_LABEL, type ReturnStatus } from "../types";

interface PropTypes {
  status: ReturnStatus;
}

export const ReturnStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={RETURN_STATUS_VARIANT[status]}>
      {RETURN_STATUS_LABEL[status]}
    </Badge>
  );
};
