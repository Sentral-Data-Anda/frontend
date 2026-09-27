import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  IBADAH_LIST_PATH,
  attendanceLabel,
  formatServiceDate,
  formatServiceTime,
} from "../model";
import type { Ibadah } from "../types";

const editHrefOf = (ibadah: Ibadah) =>
  editHref(MENU.PERIBADAHAN, MENU.IBADAH, ibadah.code);

const saveFocus = (ibadah: Ibadah) =>
  saveListFocus(IBADAH_LIST_PATH, ibadah.code);

const labelOf = (ibadah: Ibadah) =>
  `Ubah ${ibadah.typeIbadah.name}, ${formatServiceDate(ibadah.date)}`;

const metaOf = (ibadah: Ibadah) =>
  [
    formatServiceDate(ibadah.date),
    formatServiceTime(ibadah.startTime, null),
    ibadah.theme,
  ]
    .filter(Boolean)
    .join(" · ");

const attendanceCell = (ibadah: Ibadah) => {
  const label = attendanceLabel(ibadah);

  return label ? (
    <span className="text-muted-foreground block truncate text-right tabular-nums">
      {label}
    </span>
  ) : (
    <span className="block text-right">
      <OptionalText text={null} empty="Belum ada hitungan" />
    </span>
  );
};

interface PropTypes {
  ibadah: Ibadah;
  isCanUpdate?: boolean;
}

export const IbadahListItemRow = (props: PropTypes) => {
  const { ibadah, isCanUpdate = false } = props;

  const attendance = attendanceLabel(ibadah);

  return (
    <DataListRow
      id={ibadah.code}
      title={ibadah.typeIbadah.name}
      meta={metaOf(ibadah)}
      trailing={
        <>
          {attendance ? (
            <span className="text-muted-foreground shrink-0 text-caption tabular-nums">
              {attendance}
            </span>
          ) : null}

          {isCanUpdate ? (
            <Link
              href={editHrefOf(ibadah)}
              onClick={() => saveFocus(ibadah)}
              aria-label={labelOf(ibadah)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export function ibadahTable(isCanUpdate: boolean): DataTableConfig<Ibadah> {
  return {
    columns: [
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1.8fr)",
        narrowWidth: "minmax(0,1.7fr)",
        cell: (ibadah) => (
          <span className="block truncate tabular-nums">
            {formatServiceDate(ibadah.date)}
          </span>
        ),
      },
      {
        key: "time",
        header: "Jam",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (ibadah) => (
          <span className="block truncate tabular-nums">
            {formatServiceTime(ibadah.startTime, ibadah.endTime)}
          </span>
        ),
      },
      {
        key: "type",
        header: "Tipe ibadah",
        width: "minmax(0,1.6fr)",
        narrowWidth: "minmax(0,1.6fr)",
        cell: (ibadah) => (
          <span
            className="block truncate font-medium"
            title={ibadah.typeIbadah.name}
          >
            {ibadah.typeIbadah.name}
          </span>
        ),
      },
      {
        key: "theme",
        header: "Tema",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,1.6fr)",
        cell: (ibadah) => (
          <OptionalText text={ibadah.theme} empty="Tanpa tema" />
        ),
      },
      {
        key: "preacher",
        header: "Pengkhotbah",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (ibadah) => (
          <OptionalText text={ibadah.preacher} empty="Tanpa pengkhotbah" />
        ),
      },
      {
        key: "room",
        header: "Ruang",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (ibadah) => (
          <OptionalText text={ibadah.room?.name} empty="Tanpa ruang" />
        ),
      },
      {
        key: "attendance",
        header: "Hadir",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: attendanceCell,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
