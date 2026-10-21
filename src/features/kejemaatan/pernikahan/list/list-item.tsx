import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDate, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { MARRIAGE_LIST_PATH, coupleName } from "../model";
import type { MarriageListItem } from "../types";

import { MarriageStatus } from "./marriage-status";

interface PropTypes {
  marriage: MarriageListItem;
}

export const MarriageListItemRow = (props: PropTypes) => {
  const { marriage } = props;

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
        narrowWidth: "minmax(0,1.4fr)",
        cell: (marriage) => (
          <OptionalText
            text={
              marriage.marriedAt ? formatDateShort(marriage.marriedAt) : null
            }
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
          <OptionalText
            text={marriage.marriedPlace}
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
    getRowActions: (x) => ({
      label: `Ubah pernikahan ${coupleName(x)}`,
      edit: {
        href: isCanUpdate
          ? editHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN, x.id)
          : undefined,
        onNavigate: () => saveListFocus(MARRIAGE_LIST_PATH, x.id),
        label: `Ubah pernikahan ${coupleName(x)}`,
      },
    }),
  };
}
