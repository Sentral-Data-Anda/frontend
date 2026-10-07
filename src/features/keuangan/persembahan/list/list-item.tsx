import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { DETAIL_LINK } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort, formatRupiah } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";
import { RECEIVE_METHOD_LABEL } from "@/types/keuangan";

import {
  PERSEMBAHAN_LIST_PATH,
  giverOf,
  journalHref,
  persembahanHref,
} from "../model";
import type { Persembahan } from "../types";
import { PersembahanStatusBadge } from "../ui";

const LINK = `${DETAIL_LINK} relative`;

const saveFocus = (row: Persembahan) =>
  saveListFocus(PERSEMBAHAN_LIST_PATH, row.code);

const detailHrefOf = (row: Persembahan) => persembahanHref(row.code);

const viewLabelOf = (row: Persembahan) =>
  `Lihat persembahan ${row.code}, ${giverOf(row)}, ${formatRupiah(Number(row.amount))}`;

const amountText = (row: Persembahan) => (
  <span
    className={cn(
      "block truncate tabular-nums",
      row.status === "VOID" && "text-muted-foreground line-through",
    )}
  >
    {formatRupiah(Number(row.amount))}
  </span>
);

const journalCell = (row: Persembahan, isLinked: boolean) => {
  if (!row.journal) {
    return <span className="text-muted-foreground block">—</span>;
  }

  return isLinked ? (
    <Link
      href={journalHref(row.journal.publicId)}
      className={cn(LINK, "block truncate tabular-nums")}
    >
      {row.journal.code}
    </Link>
  ) : (
    <span className="block truncate tabular-nums">{row.journal.code}</span>
  );
};

interface PropTypes {
  row: Persembahan;
}

export const PersembahanListItemRow = (props: PropTypes) => {
  const { row } = props;

  return (
    <DataListRow
      id={row.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(row)}
          onClick={() => saveFocus(row)}
          aria-label={viewLabelOf(row)}
          className={cn(
            TABLE_ROW_LINK,
            "tabular-nums",
            row.status === "VOID" && "text-muted-foreground line-through",
          )}
        >
          {formatRupiah(Number(row.amount))}
        </Link>
      }
      meta={`${row.typePersembahan.name} · ${giverOf(row)}`}
      trailing={
        <>
          <span className="text-muted-foreground text-caption tabular-nums">
            {formatDateShort(row.receivedDate)}
          </span>
          <PersembahanStatusBadge status={row.status} />
        </>
      }
    />
  );
};

type Column = DataTableColumn<Persembahan>;

export function persembahanTable(
  isJournalLinked: boolean,
): DataTableConfig<Persembahan> {
  const columns: Column[] = [
    {
      key: "date",
      header: "Tanggal",
      width: "minmax(0,1.2fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {formatDateShort(row.receivedDate)}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipe",
      width: "minmax(0,1.5fr)",
      cell: (row) => (
        <span className="block truncate" title={row.typePersembahan.name}>
          {row.typePersembahan.name}
        </span>
      ),
    },
    {
      key: "giver",
      header: "Pemberi",
      width: "minmax(0,2fr)",
      cell: (row) => (
        <span className="block truncate font-medium" title={giverOf(row)}>
          {giverOf(row)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Nominal",
      width: "minmax(0,1.2fr)",
      align: "end",
      cell: amountText,
    },
    {
      key: "method",
      header: "Cara",
      width: "minmax(0,1fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate">
          {RECEIVE_METHOD_LABEL[row.receiveMethod]}
        </span>
      ),
    },
    {
      key: "journal",
      header: "Jurnal",
      width: "minmax(0,1fr)",
      isSecondary: true,
      cell: (row) => journalCell(row, isJournalLinked),
    },
    {
      key: "status",
      header: "Status",
      width: "minmax(0,1fr)",
      cell: (row) => <PersembahanStatusBadge status={row.status} />,
    },
  ];

  return {
    columns,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
