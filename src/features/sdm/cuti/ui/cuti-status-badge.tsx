import { Badge } from "@/components/common/display";

import { isUnderApproval } from "../model";
import { CUTI_STATUS_LABEL, type Cuti, type CutiStatus } from "../types";

const VARIANT: Record<CutiStatus, "draft" | "success" | "due" | "neutral"> = {
  PENDING: "draft",
  APPROVED: "success",
  REJECTED: "due",
  CANCELLED: "neutral",
};

interface PropTypes {
  cuti: Cuti;
}

export const CutiStatusBadge = (props: PropTypes) => {
  const { cuti } = props;

  if (isUnderApproval(cuti))
    return <Badge variant="wait">Sedang ditandatangani</Badge>;

  return (
    <Badge variant={VARIANT[cuti.status]}>
      {CUTI_STATUS_LABEL[cuti.status]}
    </Badge>
  );
};
