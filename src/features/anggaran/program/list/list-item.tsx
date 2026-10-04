import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatRupiah } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  PROGRAM_LIST_PATH,
  programDetailHref,
  programEditHref,
  programStateOf,
} from "../model";
import type { Program } from "../types";
import { ProgramStatusBadge } from "../ui";

const saveFocus = (row: Program) =>
  saveListFocus(PROGRAM_LIST_PATH, row.publicId);

const detailHrefOf = (row: Program) => programDetailHref(row.publicId);

const viewLabelOf = (row: Program) => `Lihat usulan ${row.name}`;

const isEditable = (row: Program) => programStateOf(row) === "DRAFT";

const editLink = (row: Program) =>
  isEditable(row) ? (
    <Link
      href={programEditHref(row.publicId)}
      onClick={() => saveFocus(row)}
      aria-label={`Ubah usulan ${row.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  ) : null;

interface PropTypes {
  row: Program;
  isCanUpdate?: boolean;
}

export const ProgramListItem = (props: PropTypes) => {
  const { row, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={row.publicId}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(row)}
          onClick={() => saveFocus(row)}
          aria-label={viewLabelOf(row)}
          className={TABLE_ROW_LINK}
        >
          {row.name}
        </Link>
      }
      meta={[row.code, row.bapel?.name].filter(Boolean).join(" · ")}
      trailing={
        <>
          <div className="min-w-0">
            <p className="truncate text-right text-body font-medium tabular-nums">
              {formatRupiah(Number(row.proposedAmount))}
            </p>
            <div className="flex justify-end">
              <ProgramStatusBadge program={row} />
            </div>
          </div>
          {isCanUpdate ? editLink(row) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<Program>;

const COLUMNS: Column[] = [
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    cell: (row) => (
      <span className="block truncate tabular-nums">{row.code}</span>
    ),
  },
  {
    key: "name",
    header: "Nama",
    width: "minmax(0,2.5fr)",
    cell: (row) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium" title={row.name}>
          {row.name}
        </span>
        {row.isUnplanned ? (
          <span className="text-muted-foreground block text-caption">
            Mendadak
          </span>
        ) : null}
      </span>
    ),
  },
  {
    key: "bapel",
    header: "Komisi",
    width: "minmax(0,1.8fr)",
    cell: (row) => (
      <span className="block truncate">{row.bapel?.name ?? "—"}</span>
    ),
  },
  {
    key: "year",
    header: "Tahun",
    width: "minmax(0,0.8fr)",
    cell: (row) => (
      <span className="block truncate tabular-nums">{row.year}</span>
    ),
  },
  {
    key: "items",
    header: "Rincian",
    width: "minmax(0,0.8fr)",
    align: "end",
    isSecondary: true,
    cell: (row) => (
      <span className="block truncate tabular-nums">{row.itemCount}</span>
    ),
  },
  {
    key: "amount",
    header: "Nominal",
    width: "minmax(0,1.5fr)",
    align: "end",
    cell: (row) => (
      <span className="block truncate font-medium tabular-nums">
        {formatRupiah(Number(row.proposedAmount))}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.2fr)",
    cell: (row) => <ProgramStatusBadge program={row} />,
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: editLink,
};

export function programTable(isCanUpdate = false): DataTableConfig<Program> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
