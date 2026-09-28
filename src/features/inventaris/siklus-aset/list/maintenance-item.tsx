import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Badge, OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  CYCLE_LIST_PATH,
  MAINTENANCE_STATUS_LABEL,
  MAINTENANCE_STATUS_VARIANT,
  maintenanceEditHref,
  moneyOf,
} from "../model";
import type { Maintenance } from "../types";

const editHrefOf = (row: Maintenance) => maintenanceEditHref(row.code);

const saveFocus = (row: Maintenance) =>
  saveListFocus(CYCLE_LIST_PATH, row.code);

const labelOf = (row: Maintenance) =>
  `Ubah perawatan ${row.asset.name}, ${formatDateShort(row.scheduledDate)}`;

const dateOf = (row: Maintenance) =>
  formatDateShort(row.completedDate ?? row.scheduledDate);

const statusOf = (row: Maintenance) => (
  <Badge variant={MAINTENANCE_STATUS_VARIANT[row.status]}>
    {MAINTENANCE_STATUS_LABEL[row.status]}
  </Badge>
);

interface PropTypes {
  row: Maintenance;
  isCanUpdate: boolean;
}

export const MaintenanceItem = (props: PropTypes) => {
  const { row, isCanUpdate } = props;

  return (
    <DataListRow
      id={row.code}
      title={row.asset.name}
      meta={`${dateOf(row)} · ${row.description}`}
      trailing={
        <>
          {statusOf(row)}
          {isCanUpdate ? (
            <Link
              href={editHrefOf(row)}
              onClick={() => saveFocus(row)}
              aria-label={labelOf(row)}
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

const truncated = (text: string, isStrong = false) => (
  <span
    className={cn("block truncate", isStrong && "font-medium")}
    title={text}
  >
    {text}
  </span>
);

export function maintenanceTable(
  isCanUpdate: boolean,
): DataTableConfig<Maintenance> {
  return {
    columns: [
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1fr)",
        cell: (row) => (
          <span className="block truncate tabular-nums">{dateOf(row)}</span>
        ),
      },
      {
        key: "asset",
        header: "Barang",
        width: "minmax(0,2fr)",
        cell: (row) => truncated(row.asset.name, true),
      },
      {
        key: "description",
        header: "Keterangan",
        width: "minmax(0,2.5fr)",
        cell: (row) => truncated(row.description),
      },
      {
        key: "cost",
        header: "Biaya",
        width: "minmax(0,1fr)",
        align: "end",
        isSecondary: true,
        cell: (row) => (
          <span className="tabular-nums">
            <OptionalText text={moneyOf(row.cost)} empty="Tanpa biaya" />
          </span>
        ),
      },
      {
        key: "performer",
        header: "Dikerjakan oleh",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (row) => (
          <OptionalText
            text={row.supplier?.name ?? row.performedBy}
            empty="Belum ditentukan"
          />
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        cell: statusOf,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
