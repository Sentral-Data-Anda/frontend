import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge, OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  CYCLE_LIST_PATH,
  DISPOSAL_METHOD_LABEL,
  DISPOSAL_STATUS_LABEL,
  DISPOSAL_STATUS_VARIANT,
  disposalHref,
  moneyOf,
} from "../model";
import type { Disposal } from "../types";

const hrefOf = (row: Disposal) => disposalHref(row.code);

const saveFocus = (row: Disposal) => saveListFocus(CYCLE_LIST_PATH, row.code);

const labelOf = (row: Disposal) =>
  `Lihat pelepasan ${row.asset.name}, ${formatDateShort(row.disposalDate)}`;

const proceedsOf = (row: Disposal) =>
  row.method === "SOLD" ? moneyOf(row.proceeds) : null;

const metaOf = (row: Disposal) =>
  [
    formatDateShort(row.disposalDate),
    DISPOSAL_METHOD_LABEL[row.method],
    proceedsOf(row),
  ]
    .filter(Boolean)
    .join(" · ");

const statusOf = (row: Disposal) => (
  <Badge variant={DISPOSAL_STATUS_VARIANT[row.status]}>
    {DISPOSAL_STATUS_LABEL[row.status]}
  </Badge>
);

interface PropTypes {
  row: Disposal;
}

export const DisposalItem = (props: PropTypes) => {
  const { row } = props;

  return (
    <DataListRow
      id={row.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={hrefOf(row)}
          onClick={() => saveFocus(row)}
          aria-label={labelOf(row)}
          className={TABLE_ROW_LINK}
        >
          {row.asset.name}
        </Link>
      }
      meta={metaOf(row)}
      trailing={statusOf(row)}
    />
  );
};

export const disposalTable: DataTableConfig<Disposal> = {
  columns: [
    {
      key: "date",
      header: "Tanggal",
      width: "minmax(0,1fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {formatDateShort(row.disposalDate)}
        </span>
      ),
    },
    {
      key: "asset",
      header: "Barang",
      width: "minmax(0,2fr)",
      cell: (row) => (
        <span className="block truncate font-medium" title={row.asset.name}>
          {row.asset.name}
        </span>
      ),
    },
    {
      key: "method",
      header: "Cara",
      width: "minmax(0,1fr)",
      cell: (row) => (
        <span className="block truncate">
          {DISPOSAL_METHOD_LABEL[row.method]}
        </span>
      ),
    },
    {
      key: "proceeds",
      header: "Hasil",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (row) => (
        <span className="tabular-nums">
          <OptionalText text={proceedsOf(row)} empty="Tanpa hasil" />
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "minmax(0,1.2fr)",
      cell: statusOf,
    },
    {
      key: "reason",
      header: "Alasan",
      width: "minmax(0,2fr)",
      isSecondary: true,
      cell: (row) => <OptionalText text={row.reason} empty="Tanpa alasan" />,
    },
  ],
  getRowHref: hrefOf,
  getRowLabel: labelOf,
  onRowOpen: saveFocus,
  rowIcon: <ChevronRight />,
};
