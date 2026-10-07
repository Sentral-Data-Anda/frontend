import {
  APPROVAL_STATUS_LABEL,
  type ApprovalStatus,
} from "@/types/persetujuan";

import { Badge, type badgeVariants } from "./badge";

type BadgeVariant = NonNullable<Parameters<typeof badgeVariants>[0]>["variant"];

const VARIANT: Record<ApprovalStatus, BadgeVariant> = {
  PENDING: "wait",
  APPROVED: "success",
  REJECTED: "due",
  CANCELLED: "neutral",
};

interface PropTypes {
  status: ApprovalStatus;
}

export const ApprovalStatusBadge = (props: PropTypes) => (
  <Badge variant={VARIANT[props.status]}>
    {APPROVAL_STATUS_LABEL[props.status]}
  </Badge>
);
