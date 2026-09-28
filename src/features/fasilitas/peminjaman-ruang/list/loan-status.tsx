import { Badge } from "@/components/common/display";

import { loanStatusOf } from "../model";
import { LOAN_STATUS_LABEL, type LoanRoom, type LoanStatus } from "../types";

const VARIANT = {
  UPCOMING: "wait",
  ONGOING: "success",
  DONE: "neutral",
} as const satisfies Record<LoanStatus, string>;

interface PropTypes {
  loan: Pick<LoanRoom, "date" | "startTime" | "endTime">;
}

export const LoanStatusBadge = (props: PropTypes) => {
  const { loan } = props;

  const status = loanStatusOf(loan);

  return <Badge variant={VARIANT[status]}>{LOAN_STATUS_LABEL[status]}</Badge>;
};
