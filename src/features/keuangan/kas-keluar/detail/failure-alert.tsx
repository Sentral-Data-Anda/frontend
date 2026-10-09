"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { errorFixOf, previousMonthOf, reportFilterHref } from "../model";
import type { CashExpenseDetail } from "../types";

interface PropTypes {
  title: string;
  error: Error;
  expense?: Pick<CashExpenseDetail, "bapelId" | "expenseDate">;
}

export const FailureAlert = (props: PropTypes) => {
  const { title, error, expense } = props;

  const { isCanView: isCanViewPeriod } = useMenuAccess(MENU.FISCAL_PERIOD);
  const { isCanView: isCanViewAccount } = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const { isCanView: isCanViewReport } = useMenuAccess(MENU.BUDGET_REALIZATION);
  const fix = errorFixOf(error);
  const GRANTED: Partial<Record<string, boolean>> = {
    [MENU.FISCAL_PERIOD]: isCanViewPeriod,
    [MENU.CHART_OF_ACCOUNT]: isCanViewAccount,
    [MENU.BUDGET_REALIZATION]: isCanViewReport,
  };
  const isFixVisible = fix !== null && GRANTED[fix.menu] === true;

  // Gerbang anggaran dan periode fiskal diperbaiki ORANG YANG BERBEDA di layar
  // yang berbeda — periode oleh bendahara, laporan oleh komisi. Masing-masing
  // dapat spanduknya sendiri; satu spanduk gabungan mengirim keduanya ke tempat
  // yang salah. Pemilihannya lewat `code`, tidak pernah lewat prosa.
  const href =
    fix?.menu === MENU.BUDGET_REALIZATION && expense?.bapelId
      ? reportFilterHref(
          expense.bapelId,
          previousMonthOf(expense.expenseDate.slice(0, 10)).year,
          previousMonthOf(expense.expenseDate.slice(0, 10)).month,
        )
      : fix?.href;

  return (
    <div className="space-y-2">
      <FormAlert title={title} message={error.message} />

      {fix && isFixVisible && href ? (
        <Link
          href={href}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {fix.label}
        </Link>
      ) : null}
    </div>
  );
};
