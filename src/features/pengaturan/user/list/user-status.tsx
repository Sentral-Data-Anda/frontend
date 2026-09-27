import { Badge } from "@/components/common/display";
import type { UserStatus as Status } from "@/features/auth";

import { USER_STATUS_LABEL } from "../types";

const VARIANT = {
  PENDING: "draft",
  ACTIVE: "success",
  DEACTIVATED: "neutral",
} as const satisfies Record<Status, string>;

interface PropTypes {
  status: Status;
}

export const UserStatus = (props: PropTypes) => {
  const { status } = props;

  return <Badge variant={VARIANT[status]}>{USER_STATUS_LABEL[status]}</Badge>;
};
