import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Badge } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { TIPE_CUTI_LIST_PATH, quotaTextOf } from "../model";
import {
  TIPE_CUTI_PAID_LABEL,
  TIPE_CUTI_STATUS_LABEL,
  type TipeCuti,
} from "../types";

const editHrefOf = (row: TipeCuti) =>
  editHref(MENU.HR, MENU.LEAVE_TYPE, row.code);

const saveFocus = (row: TipeCuti) =>
  saveListFocus(TIPE_CUTI_LIST_PATH, row.code);

const labelOf = (row: TipeCuti) => `Ubah ${row.name}`;

const statusKeyOf = (row: TipeCuti) => (row.isActive ? "true" : "false");

const paidTextOf = (row: TipeCuti) =>
  TIPE_CUTI_PAID_LABEL[row.isPaid ? "true" : "false"];

const metaOf = (row: TipeCuti) =>
  `${row.code} · ${quotaTextOf(row.maxDaysPerYear)} · ${paidTextOf(row)}`;

interface PropTypes {
  tipeCuti: TipeCuti;
  isCanUpdate?: boolean;
}

export const TipeCutiListItemRow = (props: PropTypes) => {
  const { tipeCuti, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={tipeCuti.code}
      title={tipeCuti.name}
      meta={metaOf(tipeCuti)}
      trailing={
        <>
          <Badge variant={tipeCuti.isActive ? "success" : "neutral"}>
            {TIPE_CUTI_STATUS_LABEL[statusKeyOf(tipeCuti)]}
          </Badge>

          {isCanUpdate ? (
            <Link
              href={editHrefOf(tipeCuti)}
              onClick={() => saveFocus(tipeCuti)}
              aria-label={labelOf(tipeCuti)}
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

export function tipeCutiTable(isCanUpdate: boolean): DataTableConfig<TipeCuti> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (row) => (
          <span className="block truncate font-medium" title={row.name}>
            {row.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (row) => (
          <span className="block truncate tabular-nums">{row.code}</span>
        ),
      },
      {
        key: "maxDaysPerYear",
        header: "Jatah / tahun",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (row) => (
          <span className="block truncate tabular-nums">
            {quotaTextOf(row.maxDaysPerYear)}
          </span>
        ),
      },
      {
        key: "isPaid",
        header: "Dibayar",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (row) => (
          <span className="text-muted-foreground block truncate">
            {paidTextOf(row)}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (row) => (
          <Badge variant={row.isActive ? "success" : "neutral"}>
            {TIPE_CUTI_STATUS_LABEL[statusKeyOf(row)]}
          </Badge>
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
