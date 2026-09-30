"use client";

import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { formatRupiah } from "@/lib/format";

import type { ExpenseLine } from "../types";

const accountOf = (line: ExpenseLine) =>
  `${line.account.code} — ${line.account.name}`;

const amountOf = (line: ExpenseLine) => formatRupiah(Number(line.amount));

const LINE_TABLE: DataTableConfig<ExpenseLine> = {
  columns: [
    {
      key: "account",
      header: "Pos",
      width: "minmax(0,2.5fr)",
      cell: (line) => (
        <span className="block truncate font-medium" title={accountOf(line)}>
          {accountOf(line)}
        </span>
      ),
    },
    {
      key: "description",
      header: "Keterangan",
      width: "minmax(0,2.5fr)",
      isSecondary: true,
      cell: (line) => (
        <span className="block truncate" title={line.description ?? ""}>
          {line.description ?? "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      width: "minmax(0,1.3fr)",
      align: "end",
      cell: (line) => (
        <span className="block truncate font-medium tabular-nums">
          {amountOf(line)}
        </span>
      ),
    },
  ],
};

interface PropTypes {
  lines: ExpenseLine[];
  isRefreshing: boolean;
}

export const LineList = (props: PropTypes) => {
  const { lines, isRefreshing } = props;

  return (
    <DataList
      items={lines}
      getKey={(line) => line.publicId}
      label="Rincian kas keluar"
      isRefreshing={isRefreshing}
      emptyTitle="Belum ada rincian"
      table={LINE_TABLE}
    >
      {(line) => (
        <DataListRow
          title={accountOf(line)}
          meta={line.description ?? undefined}
          trailing={
            <span className="text-body font-medium tabular-nums">
              {amountOf(line)}
            </span>
          }
        />
      )}
    </DataList>
  );
};
