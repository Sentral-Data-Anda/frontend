"use client";

import Link from "next/link";

import { Panel } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { TaggedTotal, type TaggedPart } from "@/features/anggaran/shared";
import { useMenuAccess } from "@/features/auth";
import { formatAmount, formatDate } from "@/lib/format";
import { sumAmounts } from "@/lib/number";

import { accountHref, expenseHref, programHref } from "../model";
import type { BudgetReportLine } from "../types";

import { DETAIL_LINK } from "./link-style";

const UNTAGGED_LABEL = "Tanpa program";

const UNTAGGED_HINT =
  "Pemakaian tanpa program — konsumsi rapat, fotokopi, dan belanja di luar program.";

const PROGRAM_SUMMARY_LABEL = "Pemakaian per program";

const partsOf = (lines: readonly BudgetReportLine[]): TaggedPart[] => {
  const byProgram = new Map<string, TaggedPart>();

  for (const line of lines) {
    if (!line.program) continue;

    const current = byProgram.get(line.program.publicId);

    byProgram.set(line.program.publicId, {
      key: line.program.publicId,
      label: `${line.program.name} · ${line.program.code}`,
      amount: sumAmounts([current?.amount ?? "0", line.amount]),
      href: programHref(line.program.publicId),
    });
  }

  return [...byProgram.values()];
};

const untaggedOf = (lines: readonly BudgetReportLine[]) =>
  sumAmounts(lines.filter((line) => !line.program).map((line) => line.amount));

interface PropTypes {
  lines: readonly BudgetReportLine[];
}

export const LineList = (props: PropTypes) => {
  const { lines } = props;

  const account = useMenuAccess(MENU.AKUN);
  const program = useMenuAccess(MENU.PROGRAM);
  const expense = useMenuAccess(MENU.KAS_KELUAR);
  const total = sumAmounts(lines.map((line) => line.amount));

  return (
    <Panel label="Rincian pemakaian">
      <div className="px-gutter py-3">
        <h2 className="text-title font-semibold">Rincian pemakaian</h2>
      </div>

      <ul className="divide-hairline divide-y">
        {lines.map((line) => (
          <li key={line.publicId} className="px-gutter py-3">
            <div className="flex items-baseline gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium">
                  {line.description}
                </span>
                <span className="text-muted-foreground block text-caption tabular-nums">
                  {formatDate(line.spentDate)}
                </span>
              </span>

              <span className="shrink-0 text-body font-medium tabular-nums">
                {formatAmount(line.amount)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-caption">
              {line.account ? (
                account.isCanView ? (
                  <Link
                    href={accountHref(line.account.code)}
                    className={DETAIL_LINK}
                  >
                    {line.account.code} · {line.account.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    {line.account.code} · {line.account.name}
                  </span>
                )
              ) : null}

              {line.program ? (
                program.isCanView ? (
                  <Link
                    href={programHref(line.program.publicId)}
                    className={DETAIL_LINK}
                  >
                    {line.program.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    {line.program.name}
                  </span>
                )
              ) : (
                <span className="text-muted-foreground">{UNTAGGED_LABEL}</span>
              )}

              {line.cashExpense ? (
                expense.isCanView ? (
                  <Link
                    href={expenseHref(line.cashExpense.publicId)}
                    className={`tabular-nums ${DETAIL_LINK}`}
                  >
                    dari {line.cashExpense.code}
                  </Link>
                ) : (
                  <span className="text-muted-foreground tabular-nums">
                    dari {line.cashExpense.code}
                  </span>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="border-hairline flex items-baseline justify-between gap-3 border-t px-gutter py-3 text-body font-medium">
        <span>Total pemakaian</span>
        <span className="tabular-nums">{formatAmount(total)}</span>
      </div>

      <div className="border-hairline space-y-1 border-t px-gutter py-3">
        <h3 className="text-body font-medium">{PROGRAM_SUMMARY_LABEL}</h3>

        <TaggedTotal
          label={PROGRAM_SUMMARY_LABEL}
          parts={partsOf(lines)}
          untaggedLabel={UNTAGGED_LABEL}
          untagged={untaggedOf(lines)}
          untaggedHint={UNTAGGED_HINT}
          renderPart={(part) =>
            program.isCanView ? (
              <Link
                href={part.href ?? "#"}
                className={`min-w-0 truncate ${DETAIL_LINK}`}
              >
                {part.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate">{part.label}</span>
            )
          }
        />
      </div>
    </Panel>
  );
};
