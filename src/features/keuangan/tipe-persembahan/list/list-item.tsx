import { Pencil } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  TIPE_PERSEMBAHAN_LIST_PATH,
  accountIssueOf,
  accountLabelOf,
  offeringTypeEditHref,
} from "../model";
import type { OfferingType } from "../types";

const editHrefOf = (offeringType: OfferingType) =>
  offeringTypeEditHref(offeringType.code);

const saveFocus = (offeringType: OfferingType) =>
  saveListFocus(TIPE_PERSEMBAHAN_LIST_PATH, offeringType.code);

const labelOf = (offeringType: OfferingType) => `Ubah ${offeringType.name}`;

const accountCell = (offeringType: OfferingType) => {
  const issue = accountIssueOf(offeringType);
  const label = accountLabelOf(offeringType);

  if (!issue) {
    return (
      <span className="block truncate" title={label ?? undefined}>
        {label}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Badge variant={issue.variant}>{issue.label}</Badge>
      {label ? (
        <span className="truncate" title={label}>
          {label}
        </span>
      ) : null}
    </span>
  );
};

const flagCell = (isOn: boolean) =>
  isOn ? <span>Ya</span> : <span className="text-muted-foreground">—</span>;

const statusCell = (offeringType: OfferingType) =>
  offeringType.isActive ? (
    <Badge variant="success">Aktif</Badge>
  ) : (
    <Badge variant="neutral">Nonaktif</Badge>
  );

// Tipe nonaktif tidak dipakai lagi, jadi statusnya mendahului kedua flag.
const rowBadges = (offeringType: OfferingType) => {
  if (!offeringType.isActive) return <Badge variant="neutral">Nonaktif</Badge>;

  return (
    <>
      {offeringType.hasPeriod ? <Badge variant="outline">Periode</Badge> : null}
      {offeringType.requiresJemaat ? (
        <Badge variant="outline">Wajib jemaat</Badge>
      ) : null}
    </>
  );
};

interface PropTypes {
  offeringType: OfferingType;
  isCanUpdate?: boolean;
}

export const OfferingTypeListItemRow = (props: PropTypes) => {
  const { offeringType, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={offeringType.code}
      className="hover:bg-card relative transition-colors"
      title={
        isCanUpdate ? (
          <Link
            href={editHrefOf(offeringType)}
            onClick={() => saveFocus(offeringType)}
            aria-label={labelOf(offeringType)}
            className={TABLE_ROW_LINK}
          >
            {offeringType.name}
          </Link>
        ) : (
          offeringType.name
        )
      }
      meta={accountCell(offeringType)}
      trailing={rowBadges(offeringType)}
    />
  );
};

export function offeringTypeTable(
  isCanUpdate: boolean,
): DataTableConfig<OfferingType> {
  return {
    columns: [
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        cell: (offeringType) => (
          <span
            className="block truncate font-medium"
            title={offeringType.name}
          >
            {offeringType.name}
          </span>
        ),
      },
      {
        key: "account",
        header: "Akun pendapatan",
        width: "minmax(0,2.5fr)",
        cell: accountCell,
      },
      {
        key: "hasPeriod",
        header: "Periode",
        width: "minmax(0,1fr)",
        cell: (offeringType) => flagCell(offeringType.hasPeriod),
      },
      {
        key: "requiresJemaat",
        header: "Wajib jemaat",
        width: "minmax(0,1.2fr)",
        cell: (offeringType) => flagCell(offeringType.requiresJemaat),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        cell: statusCell,
      },
    ],
    getRowHref: isCanUpdate ? editHrefOf : undefined,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <Pencil />,
  };
}
