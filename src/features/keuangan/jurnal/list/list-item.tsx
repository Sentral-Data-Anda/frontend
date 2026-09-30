import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDate, formatDateShort, formatRupiah } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { JURNAL_LIST_PATH, journalHref, sourceLabelOf } from "../model";
import type { JournalEntry } from "../types";
import { JournalStatusBadge } from "../ui";

const saveFocus = (entry: JournalEntry) =>
  saveListFocus(JURNAL_LIST_PATH, entry.publicId);

const detailHrefOf = (entry: JournalEntry) => journalHref(entry.publicId);

const viewLabelOf = (entry: JournalEntry) =>
  `Lihat entri ${entry.code}, ${entry.description}, ${formatDate(entry.entryDate)}`;

const lineCountLabel = (entry: JournalEntry) => `${entry.lineCount} baris`;

const metaOf = (entry: JournalEntry) =>
  [
    entry.code,
    formatDateShort(entry.entryDate),
    lineCountLabel(entry),
    entry.sourceType === "MANUAL" ? null : sourceLabelOf(entry),
  ]
    .filter(Boolean)
    .join(" · ");

const noteOf = (entry: JournalEntry) => (entry.isReversal ? "pembalik" : null);

const statusOf = (entry: JournalEntry) => (
  <JournalStatusBadge status={entry.status} note={noteOf(entry)} />
);

const totalOf = (entry: JournalEntry) => (
  <span className="block truncate text-right tabular-nums">
    {formatRupiah(Number(entry.totalDebit))}
  </span>
);

interface PropTypes {
  entry: JournalEntry;
}

export const JournalListItemRow = (props: PropTypes) => {
  const { entry } = props;

  return (
    <DataListRow
      id={entry.publicId}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(entry)}
          onClick={() => saveFocus(entry)}
          aria-label={viewLabelOf(entry)}
          className={TABLE_ROW_LINK}
        >
          {entry.description}
        </Link>
      }
      meta={metaOf(entry)}
      trailing={
        <span className="flex flex-col items-end gap-0.5">
          <span className="text-body font-medium tabular-nums">
            {formatRupiah(Number(entry.totalDebit))}
          </span>
          {statusOf(entry)}
        </span>
      }
    />
  );
};

type Column = DataTableColumn<JournalEntry>;

const COLUMNS: Column[] = [
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (entry) => (
      <span className="block truncate tabular-nums">{entry.code}</span>
    ),
  },
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1.2fr)",
    cell: (entry) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(entry.entryDate)}
      </span>
    ),
  },
  {
    key: "description",
    header: "Keterangan",
    width: "minmax(0,2.5fr)",
    cell: (entry) => (
      <span className="block truncate font-medium" title={entry.description}>
        {entry.description}
      </span>
    ),
  },
  {
    key: "lines",
    header: "Baris",
    width: "minmax(0,0.8fr)",
    align: "end",
    cell: (entry) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {entry.lineCount}
      </span>
    ),
  },
  {
    key: "total",
    header: "Total (Rp)",
    width: "minmax(0,1.3fr)",
    align: "end",
    cell: totalOf,
  },
  {
    key: "source",
    header: "Sumber",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (entry) => (
      <span className="text-muted-foreground block truncate">
        {sourceLabelOf(entry)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1fr)",
    cell: statusOf,
  },
];

export function journalTable(): DataTableConfig<JournalEntry> {
  return {
    columns: COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
