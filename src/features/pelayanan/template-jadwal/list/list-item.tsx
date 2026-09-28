import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { TEMPLATE_JADWAL_LIST_PATH, rolesOf, timeRangeOf } from "../model";
import type { TemplateJadwalListItem } from "../types";

const editHrefOf = (template: TemplateJadwalListItem) =>
  editHref(MENU.PELAYANAN, MENU.TEMPLATE_JADWAL, template.code);

const saveFocus = (template: TemplateJadwalListItem) =>
  saveListFocus(TEMPLATE_JADWAL_LIST_PATH, template.code);

const labelOf = (template: TemplateJadwalListItem) => `Ubah ${template.name}`;

const metaOf = (template: TemplateJadwalListItem) =>
  `${template.bapel} · ${timeRangeOf(template)} · ${template.detail.length} tugas`;

interface PropTypes {
  template: TemplateJadwalListItem;
  isCanUpdate?: boolean;
}

export const TemplateJadwalListItemRow = (props: PropTypes) => {
  const { template, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={template.code}
      title={template.name}
      meta={metaOf(template)}
      trailing={
        isCanUpdate ? (
          <Link
            href={editHrefOf(template)}
            onClick={() => saveFocus(template)}
            aria-label={labelOf(template)}
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

export function templateJadwalTable(
  isCanUpdate: boolean,
): DataTableConfig<TemplateJadwalListItem> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (template) => (
          <span className="block truncate font-medium" title={template.name}>
            {template.name}
          </span>
        ),
      },
      {
        key: "bapel",
        header: "Badan pelayanan",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (template) => (
          <span className="block truncate" title={template.bapel}>
            {template.bapel}
          </span>
        ),
      },
      {
        key: "time",
        header: "Jam",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (template) => (
          <span className="tabular-nums">{timeRangeOf(template)}</span>
        ),
      },
      {
        key: "roles",
        header: "Tugas",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (template) => {
          const roles = rolesOf(template).join(", ");

          return (
            <span className="block truncate" title={roles}>
              {roles}
            </span>
          );
        },
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (template) => (
          <span className="tabular-nums">{template.code}</span>
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
