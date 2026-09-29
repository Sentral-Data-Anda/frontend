import { Badge } from "@/components/common/display";

import { OPNAME_STATUS_LABEL, type OpnameStatus } from "../types";

const VARIANT = {
  DRAFT: "neutral",
  COMPLETED: "draft",
  POSTED: "success",
  CANCELLED: "neutral",
} as const satisfies Record<OpnameStatus, string>;

interface PropTypes {
  status: OpnameStatus;
}

export const OpnameStatusBadge = (props: PropTypes) => {
  const { status } = props;

  return <Badge variant={VARIANT[status]}>{OPNAME_STATUS_LABEL[status]}</Badge>;
};
