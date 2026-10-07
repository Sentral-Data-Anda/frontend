"use client";

import Link from "next/link";

import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatAmount } from "@/lib/format";

import { TEXT_LINK, accountHref, entryBalanceOf } from "../model";
import type { JournalEntryDetail, JournalLine } from "../types";

const accountLabelOf = (line: JournalLine) =>
  `${line.account.code} — ${line.account.name}`;

const amount = (value: string, isMuted: boolean) => (
  <span className="block min-w-0 text-right tabular-nums">
    <span className={isMuted ? "text-muted-foreground" : "font-medium"}>
      {isMuted ? "—" : formatAmount(value)}
    </span>
  </span>
);

const sideCell = (value: string) => amount(value, !(Number(value) > 0));

const lineTable = (
  isCanViewAccount: boolean,
): DataTableConfig<JournalLine> => ({
  columns: [
    {
      key: "account",
      header: "Akun",
      width: "minmax(0,2.4fr)",
      cell: (line) => (
        <span className="block min-w-0 truncate" title={accountLabelOf(line)}>
          {isCanViewAccount ? (
            <Link href={accountHref(line.account.code)} className={TEXT_LINK}>
              {accountLabelOf(line)}
            </Link>
          ) : (
            accountLabelOf(line)
          )}
        </span>
      ),
    },
    {
      key: "description",
      header: "Keterangan",
      width: "minmax(0,2fr)",
      isSecondary: true,
      cell: (line) => (
        <span
          className="text-muted-foreground block truncate"
          title={line.description ?? undefined}
        >
          {line.description ?? "—"}
        </span>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      width: "minmax(0,1.3fr)",
      align: "end",
      cell: (line) => sideCell(line.debit),
    },
    {
      key: "credit",
      header: "Kredit",
      width: "minmax(0,1.3fr)",
      align: "end",
      cell: (line) => sideCell(line.credit),
    },
  ],
});

const metaOf = (line: JournalLine) =>
  [
    Number(line.debit) > 0
      ? `Debit ${formatAmount(line.debit)}`
      : `Kredit ${formatAmount(line.credit)}`,
    line.description,
  ]
    .filter(Boolean)
    .join(" · ");

interface PropTypes {
  entry: JournalEntryDetail;
  isRefreshing: boolean;
}

export const LineList = (props: PropTypes) => {
  const { entry, isRefreshing } = props;

  const accountAccess = useMenuAccess(MENU.AKUN);
  const balance = entryBalanceOf(entry);

  return (
    <div className="space-y-3">
      <DataList
        items={entry.lines}
        getKey={(line) => line.publicId}
        label="Baris entri jurnal"
        isRefreshing={isRefreshing}
        emptyTitle="Belum ada baris"
        emptyDescription="Entri jurnal perlu paling sedikit dua baris."
        table={lineTable(accountAccess.isCanView)}
      >
        {(line) => (
          <DataListRow
            title={accountLabelOf(line)}
            meta={metaOf(line)}
            trailing={
              <span className="text-body font-medium tabular-nums">
                {formatAmount(
                  Number(line.debit) > 0 ? line.debit : line.credit,
                )}
              </span>
            }
          />
        )}
      </DataList>

      <dl className="border-hairline mx-gutter flex flex-wrap items-baseline justify-end gap-x-6 gap-y-1 border-t pt-3 text-body tabular-nums">
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Total debit</dt>
          <dd className="font-semibold">{formatAmount(balance.debit)}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Total kredit</dt>
          <dd className="font-semibold">{formatAmount(balance.credit)}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Selisih</dt>
          <dd
            className={
              balance.isBalanced
                ? "text-success font-semibold"
                : "text-warning-foreground font-semibold"
            }
          >
            {formatAmount(balance.difference)}
          </dd>
        </div>
      </dl>
    </div>
  );
};
