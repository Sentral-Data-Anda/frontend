"use client";

import Link from "next/link";

import { DashboardCard } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { cn } from "@/lib/utils";

import { flattenTree, money } from "../model";
import type { ReportAccount, ReportQuery } from "../types";

const CODE_LINK =
  "text-muted-foreground focus-visible:ring-ring block min-h-9 shrink-0 rounded-sm text-caption leading-9 tabular-nums underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2";

const NAME_LINK =
  "text-foreground focus-visible:ring-ring block min-h-9 min-w-0 truncate rounded-sm leading-9 underline-offset-4 outline-none hover:underline focus-visible:ring-2";

const INDENT_STEP = 0.875;

interface PropTypes {
  title: string;
  nodes: readonly ReportAccount[] | undefined;
  total?: string;
  query: ReportQuery;
  emptyTitle: string;
  accountHref?: (code: string) => string;
  ledgerHref: (code: string) => string;
}

export const AccountTreePanel = (props: PropTypes) => {
  const { title, nodes, total, query, emptyTitle, accountHref, ledgerHref } =
    props;

  const rows = flattenTree(nodes ?? []);

  return (
    <DashboardCard
      title={title}
      query={query}
      trailing={
        total === undefined ? null : (
          <span className="text-body font-semibold tabular-nums">
            {money(total)}
          </span>
        )
      }
    >
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} isCompact />
      ) : (
        <ul aria-label={title} className="-mx-2.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "flex min-h-9 items-center gap-3 rounded-control pe-2.5 text-body",
                row.depth === 0 && "font-medium",
              )}
              style={{
                paddingInlineStart: `${0.625 + row.depth * INDENT_STEP}rem`,
              }}
            >
              {accountHref ? (
                <Link href={accountHref(row.code)} className={CODE_LINK}>
                  {row.code}
                </Link>
              ) : (
                <span className="text-muted-foreground shrink-0 text-caption tabular-nums">
                  {row.code}
                </span>
              )}

              <Link
                href={ledgerHref(row.code)}
                className={NAME_LINK}
                title={row.name}
              >
                {row.name}
              </Link>

              <span className="ms-auto shrink-0 tabular-nums">
                {money(row.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
};
