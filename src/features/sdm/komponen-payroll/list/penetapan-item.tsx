import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { formatDate } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import {
  PENETAPAN_LIST_PATH,
  assignmentValueText,
  penetapanEditHref,
} from "../model";
import type { PenetapanKomponen } from "../types";
import { ComponentTypeBadge } from "../ui";

const OPEN_ENDED = "Terbuka";

const saveFocus = (assignment: PenetapanKomponen) =>
  saveListFocus(PENETAPAN_LIST_PATH, assignment.publicId);

const labelOf = (assignment: PenetapanKomponen) =>
  `Ubah penetapan ${assignment.payrollComponent.name} untuk ${assignment.karyawan.name}`;

const hrefOf = (isCanUpdate: boolean) => (assignment: PenetapanKomponen) =>
  isCanUpdate ? penetapanEditHref(assignment.publicId) : undefined;

const periodOf = (assignment: PenetapanKomponen) =>
  `${formatDate(assignment.effectiveFrom)} – ${
    assignment.effectiveTo ? formatDate(assignment.effectiveTo) : OPEN_ENDED
  }`;

interface PropTypes {
  assignment: PenetapanKomponen;
  isCanUpdate?: boolean;
}

export const PenetapanListItemRow = (props: PropTypes) => {
  const { assignment, isCanUpdate = false } = props;

  const href = hrefOf(isCanUpdate)(assignment);

  return (
    <DataListRow
      id={assignment.publicId}
      title={assignment.karyawan.name}
      meta={`${assignment.payrollComponent.name} · ${assignmentValueText(assignment)} · ${periodOf(assignment)}`}
      trailing={
        href ? (
          <Link
            href={href}
            onClick={() => saveFocus(assignment)}
            aria-label={labelOf(assignment)}
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

export function penetapanTable(
  isCanUpdate: boolean,
): DataTableConfig<PenetapanKomponen> {
  return {
    columns: [
      {
        key: "karyawan",
        header: "Karyawan",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (assignment) => (
          <span
            className="block truncate font-medium"
            title={assignment.karyawan.name}
          >
            {assignment.karyawan.name}
          </span>
        ),
      },
      {
        key: "component",
        header: "Komponen",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (assignment) => (
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="truncate"
              title={assignment.payrollComponent.name}
            >
              {assignment.payrollComponent.name}
            </span>
            <ComponentTypeBadge type={assignment.payrollComponent.type} />
          </span>
        ),
      },
      {
        key: "value",
        header: "Nilai",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        align: "end",
        cell: (assignment) => (
          <span className="block truncate tabular-nums">
            {assignmentValueText(assignment)}
          </span>
        ),
      },
      {
        key: "effectiveFrom",
        header: "Berlaku dari",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        cell: (assignment) => (
          <span className="block truncate">
            {formatDate(assignment.effectiveFrom)}
          </span>
        ),
      },
      {
        key: "effectiveTo",
        header: "Berlaku sampai",
        width: "minmax(0,1.2fr)",
        narrowWidth: "minmax(0,1.2fr)",
        isSecondary: true,
        cell: (assignment) => (
          <span
            className={cn(
              "block truncate",
              assignment.effectiveTo === null && "text-muted-foreground",
            )}
          >
            {assignment.effectiveTo
              ? formatDate(assignment.effectiveTo)
              : OPEN_ENDED}
          </span>
        ),
      },
    ],
    getRowHref: hrefOf(isCanUpdate),
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
