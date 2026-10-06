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

  const { isCanView: isCanViewPeriod } = useMenuAccess(MENU.PERIODE_FISKAL);
  const { isCanView: isCanViewAccount } = useMenuAccess(MENU.AKUN);
  const { isCanView: isCanViewReport } = useMenuAccess(MENU.LAPORAN_BUDGET);
  const fix = errorFixOf(error);
  const GRANTED: Partial<Record<string, boolean>> = {
    [MENU.PERIODE_FISKAL]: isCanViewPeriod,
    [MENU.AKUN]: isCanViewAccount,
    [MENU.LAPORAN_BUDGET]: isCanViewReport,
  };
  const isFixVisible = fix !== null && GRANTED[fix.menu] === true;

  // Gerbang anggaran dan periode fiskal diperbaiki ORANG YANG BERBEDA di layar
  // yang berbeda — periode oleh bendahara, laporan oleh komisi. Masing-masing
  // dapat spanduknya sendiri; satu spanduk gabungan mengirim keduanya ke tempat
  // yang salah. Pemilihannya lewat `code`, tidak pernah lewat prosa.
  const href =
    fix?.menu === MENU.LAPORAN_BUDGET && expense?.bapelId
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
