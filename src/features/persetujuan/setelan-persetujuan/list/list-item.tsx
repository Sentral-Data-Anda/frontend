import { ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";
import { APPROVAL_DOCUMENT_LABEL } from "@/types/persetujuan";

import { SETELAN_LIST_PATH, rangeLabel, tierChainOf } from "../model";
import type { SetelanItem } from "../types";

import { ConfigStatus } from "./config-status";

const editHrefOf = (item: SetelanItem) =>
  editHref(MENU.APPROVAL, MENU.APPROVAL_WORKFLOW, item.publicId);

const saveFocus = (item: SetelanItem) =>
  saveListFocus(SETELAN_LIST_PATH, item.publicId);

const labelOf = (isCanUpdate: boolean) => (item: SetelanItem) =>
  `${isCanUpdate ? "Ubah" : "Lihat"} alur ${item.name}`;

const truncated = (text: string, className?: string) => (
  <span className={cn("block truncate", className)} title={text}>
    {text}
  </span>
);

interface PropTypes {
  item: SetelanItem;
  isCanUpdate?: boolean;
}

export const SetelanListItemRow = (props: PropTypes) => {
  const { item, isCanUpdate = false } = props;

  const meta = [
    APPROVAL_DOCUMENT_LABEL[item.documentType],
    item.bapel?.name ?? "Umum",
    rangeLabel(item.documentType, item.minAmount, item.maxAmount, true),
    `${item.steps.length} tahap`,
  ].join(" · ");

  return (
    <DataListRow
      id={item.publicId}
      title={
        <span className={item.isActive ? undefined : "text-muted-foreground"}>
          {item.name}
        </span>
      }
      meta={meta}
      trailing={
        <>
          <ConfigStatus isActive={item.isActive} />

          <Link
            href={editHrefOf(item)}
            onClick={() => saveFocus(item)}
            aria-label={labelOf(isCanUpdate)(item)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "cursor-pointer",
            )}
          >
            {isCanUpdate ? (
              <Pencil aria-hidden />
            ) : (
              <ChevronRight aria-hidden />
            )}
          </Link>
        </>
      }
    />
  );
};

export function setelanTable(
  isCanUpdate: boolean,
): DataTableConfig<SetelanItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (item) =>
          truncated(
            item.name,
            cn("font-medium", !item.isActive && "text-muted-foreground"),
          ),
      },
      {
        key: "documentType",
        header: "Jenis dokumen",
        width: "minmax(0,1.4fr)",
        narrowWidth: "minmax(0,1.4fr)",
        cell: (item) => truncated(APPROVAL_DOCUMENT_LABEL[item.documentType]),
      },
      {
        key: "bapel",
        header: "Berlaku untuk",
        width: "minmax(0,1.6fr)",
        narrowWidth: "minmax(0,1.6fr)",
        cell: (item) => truncated(item.bapel?.name ?? "Semua badan pelayanan"),
      },
      {
        key: "range",
        header: "Rentang",
        width: "minmax(0,1.6fr)",
        narrowWidth: "minmax(0,1.6fr)",
        cell: (item) =>
          truncated(
            rangeLabel(item.documentType, item.minAmount, item.maxAmount),
            "tabular-nums",
          ),
      },
      {
        key: "steps",
        header: "Tahapan",
        width: "minmax(0,2.4fr)",
        isSecondary: true,
        cell: (item) => truncated(tierChainOf(item)),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (item) => <ConfigStatus isActive={item.isActive} />,
      },
    ],
    getRowHref: editHrefOf,
    getRowLabel: labelOf(isCanUpdate),
    onRowOpen: saveFocus,
    rowIcon: isCanUpdate ? <Pencil /> : <ChevronRight />,
  };
}
