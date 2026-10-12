"use client";

import Link from "next/link";

import { PANEL_TITLE, Panel } from "@/components/common/display";
import { MENU, detailHref } from "@/config/menu";
import { formatDate } from "@/lib/format";

import { money } from "../model";
import type { LoanDetail } from "../types";

interface PropTypes {
  lines: LoanDetail["lines"];
}

const PORTION_LABEL = { PRINCIPAL: "Pokok", INTEREST: "Bunga" } as const;

const LINK =
  "focus-visible:ring-ring rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2";

/** Kas yang menunjuk pinjaman ini — yang benar-benar terjadi, bukan rencana. */
export const LoanLines = (props: PropTypes) => {
  const { lines } = props;

  const rows = [
    ...lines.receipts.map((line) => ({
      key: `r-${line.publicId}`,
      date: line.cashReceipt.receiptDate,
      code: line.cashReceipt.code,
      href: detailHref(MENU.FINANCE, MENU.KAS_MASUK, line.cashReceipt.publicId),
      kind: "Kas Masuk",
      portion: line.loanPortion,
      amount: line.amount,
    })),
    ...lines.expenses.map((line) => ({
      key: `e-${line.publicId}`,
      date: line.cashExpense.expenseDate,
      code: line.cashExpense.code,
      href: detailHref(
        MENU.FINANCE,
        MENU.KAS_KELUAR,
        line.cashExpense.publicId,
      ),
      kind: "Kas Keluar",
      portion: line.loanPortion,
      amount: line.amount,
    })),
  ].sort((left, right) => right.date.localeCompare(left.date));

  return (
    <Panel label="Catatan kas">
      <h2 className={`${PANEL_TITLE} pb-1`}>Catatan kas</h2>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-body">
          Belum ada Kas Masuk atau Kas Keluar yang menunjuk pinjaman ini.
          Pencairan dan cicilan dicatat di sana, dan barisnya memilih pinjaman
          ini beserta bagiannya.
        </p>
      ) : (
        <ul className="divide-hairline -mx-2.5 divide-y">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex min-h-11 items-center gap-3 px-2.5 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium">
                  <Link href={row.href} className={LINK}>
                    {row.code}
                  </Link>
                </p>
                <p className="text-muted-foreground truncate text-caption">
                  {[
                    formatDate(row.date),
                    row.kind,
                    row.portion ? PORTION_LABEL[row.portion] : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              <span className="shrink-0 text-body font-semibold tabular-nums">
                {money(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
