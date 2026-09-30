import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { formatRupiah } from "@/lib/format";

import type { CashReceiptDetail, CashReceiptLine } from "../types";

const posOf = (line: CashReceiptLine) =>
  `${line.account.code} — ${line.account.name}`;

const amountOf = (line: CashReceiptLine) => (
  <span className="block truncate text-right font-medium tabular-nums">
    {formatRupiah(Number(line.amount))}
  </span>
);

const LINE_TABLE: DataTableConfig<CashReceiptLine> = {
  columns: [
    {
      key: "pos",
      header: "Pos",
      width: "minmax(0,2.5fr)",
      cell: (line) => (
        <span className="block truncate font-medium" title={posOf(line)}>
          {posOf(line)}
        </span>
      ),
    },
    {
      key: "description",
      header: "Keterangan",
      width: "minmax(0,2.5fr)",
      isSecondary: true,
      cell: (line) => (
        <span
          className="text-muted-foreground block truncate"
          title={line.description ?? ""}
        >
          {line.description ?? "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal (Rp)",
      width: "minmax(0,1.4fr)",
      align: "end",
      cell: amountOf,
    },
  ],
};

interface PropTypes {
  receipt: CashReceiptDetail;
  isRefreshing: boolean;
}

export const LineList = (props: PropTypes) => {
  const { receipt, isRefreshing } = props;

  return (
    <DataList
      items={receipt.lines}
      getKey={(line) => line.publicId}
      label="Rincian kas masuk"
      isRefreshing={isRefreshing}
      emptyTitle="Belum ada baris"
      table={LINE_TABLE}
    >
      {(line) => (
        <DataListRow
          title={posOf(line)}
          meta={line.description ?? undefined}
          trailing={amountOf(line)}
        />
      )}
    </DataList>
  );
};
