import { Badge } from "@/components/common/display";

import {
  REGISTRATION_STATUS_LABEL,
  type RegistrationStatus as Status,
} from "../types";

const VARIANT = {
  CONFIRMED: "success",
  PENDING_PAYMENT: "draft",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
} as const satisfies Record<Status, string>;

interface PropTypes {
  status: Status;
}

export const RegistrationStatus = (props: PropTypes) => {
  const { status } = props;

  return (
    <Badge variant={VARIANT[status]}>{REGISTRATION_STATUS_LABEL[status]}</Badge>
  );
};
