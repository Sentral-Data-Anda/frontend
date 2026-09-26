import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDate } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { MARRIAGE_LIST_PATH, coupleName } from "../model";
import type { MarriageListItem } from "../types";

import { MarriageStatus } from "./marriage-status";
import { OptionalName } from "./optional-name";

interface PropTypes {
  marriage: MarriageListItem;
  isCanUpdate?: boolean;
}

export const MarriageListItemRow = (props: PropTypes) => {
  const { marriage, isCanUpdate = false } = props;

  const meta = [
    marriage.marriedAt ? formatDate(marriage.marriedAt) : null,
    marriage.marriedPlace,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <DataListRow
      id={marriage.id}
      title={coupleName(marriage)}
      meta={meta}
      trailing={
        <>
          <MarriageStatus endedAt={marriage.endedAt} />

          {isCanUpdate ? (
            <Link
              href={editHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN, marriage.id)}
              onClick={() => saveListFocus(MARRIAGE_LIST_PATH, marriage.id)}
              aria-label={`Ubah pernikahan ${coupleName(marriage)}`}
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

export function marriageTable(
  isCanUpdate: boolean,
): DataTableConfig<MarriageListItem> {
  return {
    columns: [
      {
        key: "husband",
        header: "Suami",
        width: "minmax(0,2fr)",
        cell: (marriage) => (
          <span
            className="block truncate font-medium"
            title={marriage.husband.name}
          >
            {marriage.husband.name}
          </span>
        ),
      },
      {
        key: "wife",
        header: "Istri",
        width: "minmax(0,2fr)",
        cell: (marriage) => (
          <span className="block truncate" title={marriage.wife.name}>
            {marriage.wife.name}
          </span>
        ),
      },
      {
        key: "marriedAt",
        header: "Tanggal menikah",
        width: "minmax(0,1fr)",
        cell: (marriage) => (
          <OptionalName
            name={marriage.marriedAt ? formatDate(marriage.marriedAt) : null}
            empty="Tanggal belum dicatat"
          />
        ),
      },
      {
        key: "marriedPlace",
        header: "Tempat",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (marriage) => (
          <OptionalName
            name={marriage.marriedPlace}
            empty="Tempat belum dicatat"
          />
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        cell: (marriage) => <MarriageStatus endedAt={marriage.endedAt} />,
      },
    ],
    getRowHref: isCanUpdate
      ? (marriage) => editHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN, marriage.id)
      : undefined,
    getRowLabel: (marriage) => `Ubah pernikahan ${coupleName(marriage)}`,
    onRowOpen: (marriage) => saveListFocus(MARRIAGE_LIST_PATH, marriage.id),
    rowIcon: <Pencil />,
  };
}
