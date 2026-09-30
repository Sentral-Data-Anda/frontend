import { Badge } from "@/components/common/display";

import {
  EXPENSE_STATE_LABEL,
  EXPENSE_STATE_VARIANT,
  expenseStateOf,
} from "../model";
import type { CashExpense } from "../types";

interface PropTypes {
  expense: Pick<CashExpense, "status" | "approval">;
}

export const ExpenseStateBadge = (props: PropTypes) => {
  const { expense } = props;

  const state = expenseStateOf(expense);

  return (
    <Badge variant={EXPENSE_STATE_VARIANT[state]}>
      {EXPENSE_STATE_LABEL[state]}
    </Badge>
  );
};
