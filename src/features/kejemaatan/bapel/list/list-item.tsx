import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { BAPEL_LIST_PATH } from "../model";
import type { BapelListItem } from "../types";

import { RuleSummary } from "./rule-summary";

interface PropTypes {
  bapel: BapelListItem;
  isCanUpdate?: boolean;
}

export const BapelListItemRow = (props: PropTypes) => {
  const { bapel, isCanUpdate = false } = props;

  const meta = [
    bapel.code,
    bapel.rules.length ? `${bapel.rules.length} aturan` : "Tanpa aturan",
  ].join(" · ");

  return (
    <DataListRow
      id={bapel.code}
      title={bapel.name}
      meta={meta}
      trailing={
        isCanUpdate ? (
          <Link
            href={editHref(MENU.KEJEMAATAN, MENU.BAPEL, bapel.code)}
            onClick={() => saveListFocus(BAPEL_LIST_PATH, bapel.code)}
            aria-label={`Ubah ${bapel.name}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "cursor-pointer",
            )}
          >
            <Pencil aria-hidden />
          </Link>
        ) : null
      }
    />
  );
};

export function bapelTable(
  isCanUpdate: boolean,
): DataTableConfig<BapelListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (bapel) => (
          <span className="block truncate font-medium" title={bapel.name}>
            {bapel.name}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (bapel) => <span className="tabular-nums">{bapel.code}</span>,
      },
      {
        key: "rules",
        header: "Aturan",
        width: "minmax(0,2fr)",
        isSecondary: true,
        cell: (bapel) => <RuleSummary rules={bapel.rules} />,
      },
    ],
    getRowHref: isCanUpdate
      ? (bapel) => editHref(MENU.KEJEMAATAN, MENU.BAPEL, bapel.code)
      : undefined,
    getRowLabel: (bapel) => `Ubah ${bapel.name}`,
    onRowOpen: (bapel) => saveListFocus(BAPEL_LIST_PATH, bapel.code),
    rowIcon: <Pencil />,
  };
}
