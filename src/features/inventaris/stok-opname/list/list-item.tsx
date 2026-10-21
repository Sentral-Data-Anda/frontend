import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDate, formatDateShort, formatNumber } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  OPNAME_LIST_PATH,
  opnameEditHref,
  opnameHref,
  roomNameOf,
} from "../model";
import type { Opname } from "../types";
import { OpnameStatusBadge } from "../ui";

const saveFocus = (opname: Opname) =>
  saveListFocus(OPNAME_LIST_PATH, opname.code);

const detailHrefOf = (opname: Opname) => opnameHref(opname.code);

const viewLabelOf = (opname: Opname) =>
  `Lihat stok opname ${roomNameOf(opname.room)}, ${formatDate(opname.opnameDate)}`;

const opnameMetaOf = (opname: Opname) =>
  [
    formatDate(opname.opnameDate),
    `${formatNumber(opname.itemCount)} barang`,
    `${formatNumber(opname.differenceCount)} selisih`,
  ].join(" · ");

interface PropTypes {
  opname: Opname;
}

export const OpnameListItemRow = (props: PropTypes) => {
  const { opname } = props;

  return (
    <DataListRow
      id={opname.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(opname)}
          onClick={() => saveFocus(opname)}
          aria-label={viewLabelOf(opname)}
          className={TABLE_ROW_LINK}
        >
          {roomNameOf(opname.room)}
        </Link>
      }
      meta={opnameMetaOf(opname)}
      trailing={
        <>
          <OpnameStatusBadge status={opname.status} />
        </>
      }
    />
  );
};

type Column = DataTableColumn<Opname>;

const COLUMNS: Column[] = [
  {
    key: "date",
    header: "Tanggal",
    width: "minmax(0,1fr)",
    cell: (opname) => (
      <span className="block truncate tabular-nums">
        {formatDateShort(opname.opnameDate)}
      </span>
    ),
  },
  {
    key: "code",
    header: "Kode",
    width: "minmax(0,1.2fr)",
    isSecondary: true,
    cell: (opname) => (
      <span className="text-muted-foreground block truncate tabular-nums">
        {opname.code}
      </span>
    ),
  },
  {
    key: "room",
    header: "Ruang",
    width: "minmax(0,2fr)",
    cell: (opname) => (
      <span
        className="block truncate font-medium"
        title={roomNameOf(opname.room)}
      >
        {roomNameOf(opname.room)}
      </span>
    ),
  },
  {
    key: "items",
    header: "Barang",
    width: "minmax(0,0.8fr)",
    align: "end",
    cell: (opname) => (
      <span className="block truncate tabular-nums">
        {formatNumber(opname.itemCount)}
      </span>
    ),
  },
  {
    key: "difference",
    header: "Selisih",
    width: "minmax(0,0.8fr)",
    align: "end",
    cell: (opname) => (
      <span
        className={cn(
          "block truncate tabular-nums",
          opname.differenceCount === 0 && "text-muted-foreground",
        )}
      >
        {formatNumber(opname.differenceCount)}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.2fr)",
    cell: (opname) => <OpnameStatusBadge status={opname.status} />,
  },
];

export function opnameTable(isCanUpdate: boolean): DataTableConfig<Opname> {
  return {
    columns: COLUMNS,
    getRowActions: (x) => ({
      label: viewLabelOf(x),
      view: {
        href: detailHrefOf(x),
        onNavigate: () => saveFocus(x),
        label: viewLabelOf(x),
      },
      edit:
        isCanUpdate && x.status === "DRAFT"
          ? {
              href: opnameEditHref(x.publicId),
              onNavigate: () => saveFocus(x),
              label: `Ubah stok opname ${x.code}`,
            }
          : undefined,
    }),
  };
}
