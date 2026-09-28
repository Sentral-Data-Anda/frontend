import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { SKILL_MUSIK_LIST_PATH } from "../model";
import type { SkillMusik } from "../types";

const editHrefOf = (skillMusik: SkillMusik) =>
  editHref(MENU.PELAYANAN, MENU.SKILL_MUSIK, String(skillMusik.id));

const saveFocus = (skillMusik: SkillMusik) =>
  saveListFocus(SKILL_MUSIK_LIST_PATH, String(skillMusik.id));

const labelOf = (skillMusik: SkillMusik) => `Ubah ${skillMusik.name}`;

interface PropTypes {
  skillMusik: SkillMusik;
  isCanUpdate?: boolean;
}

export const SkillMusikListItemRow = (props: PropTypes) => {
  const { skillMusik, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={String(skillMusik.id)}
      title={skillMusik.name}
      trailing={
        isCanUpdate ? (
          <Link
            href={editHrefOf(skillMusik)}
            onClick={() => saveFocus(skillMusik)}
            aria-label={labelOf(skillMusik)}
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

export function skillMusikTable(
  isCanUpdate: boolean,
): DataTableConfig<SkillMusik> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (skillMusik) => (
          <span className="block truncate font-medium" title={skillMusik.name}>
            {skillMusik.name}
          </span>
        ),
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
