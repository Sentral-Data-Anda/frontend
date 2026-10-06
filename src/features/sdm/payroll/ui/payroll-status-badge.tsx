import { Badge } from "@/components/common/display";

import { isUnderApproval } from "../model";
import {
  PAYROLL_STATUS_LABEL,
  PAYROLL_STATUS_VARIANT,
  type PayrollRunDetail,
  type PayrollStatus,
} from "../types";

/**
 * "Menunggu persetujuan" BUKAN nilai `PayrollRunStatus`: run tetap
 * `CALCULATED` dan "menunggu" hidup hanya di `approval_request`, supaya
 * keduanya tidak bisa berselisih. Jadi diturunkan dari `approval`.
 */
interface PropTypes {
  status: PayrollStatus;
  approval?: PayrollRunDetail["approval"];
}

export const PayrollStatusBadge = (props: PropTypes) => {
  const { status, approval } = props;

  if (status === "CALCULATED" && isUnderApproval({ approval })) {
    return <Badge variant="wait">Menunggu persetujuan</Badge>;
  }

  return (
    <Badge variant={PAYROLL_STATUS_VARIANT[status]}>
      {PAYROLL_STATUS_LABEL[status]}
    </Badge>
  );
};
