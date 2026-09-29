import { Badge } from "@/components/common/display";

import { REQUEST_STATUS_VARIANT } from "../model";
import { REQUEST_STATUS_LABEL, type RequestStatus } from "../types";

interface PropTypes {
  status: RequestStatus;
}

export const RequestStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={REQUEST_STATUS_VARIANT[status]}>
      {REQUEST_STATUS_LABEL[status]}
    </Badge>
  );
};
