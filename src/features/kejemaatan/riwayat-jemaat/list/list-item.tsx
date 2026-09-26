import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDate } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { RIWAYAT_LIST_PATH } from "../model";
import type { RiwayatJemaat } from "../types";

import { OptionalText } from "./optional-text";

const rowLabel = (riwayat: RiwayatJemaat) =>
  `Ubah riwayat ${riwayat.typeLabel.toLowerCase()} ${riwayat.jemaat.name}`;

interface PropTypes {
  riwayat: RiwayatJemaat;
  isCanUpdate?: boolean;
}

export const RiwayatListItemRow = (props: PropTypes) => {
  const { riwayat, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={riwayat.id}
      title={riwayat.jemaat.name}
      meta={`${riwayat.typeLabel} · ${formatDate(riwayat.date)}`}
      trailing={
        <>
          {riwayat.certificateNumber ? (
            <span
              className="text-muted-foreground text-caption max-w-24 truncate tabular-nums"
              title={`Nomor surat ${riwayat.certificateNumber}`}
            >
              {riwayat.certificateNumber}
            </span>
          ) : null}

          {isCanUpdate ? (
            <Link
              href={editHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT, riwayat.id)}
              onClick={() => saveListFocus(RIWAYAT_LIST_PATH, riwayat.id)}
              aria-label={rowLabel(riwayat)}
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

export function riwayatTable(
  isCanUpdate: boolean,
): DataTableConfig<RiwayatJemaat> {
  return {
    columns: [
      {
        key: "jemaat",
        header: "Jemaat",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (riwayat) => (
          <span
            className="block truncate font-medium"
            title={riwayat.jemaat.name}
          >
            {riwayat.jemaat.name}
          </span>
        ),
      },
      {
        key: "jemaatCode",
        header: "Kode jemaat",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (riwayat) => (
          <span className="tabular-nums">{riwayat.jemaat.code}</span>
        ),
      },
      {
        key: "type",
        header: "Jenis",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (riwayat) => riwayat.typeLabel,
      },
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (riwayat) => (
          <span className="tabular-nums">{formatDate(riwayat.date)}</span>
        ),
      },
      {
        key: "certificateNumber",
        header: "No. surat",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (riwayat) => (
          <OptionalText
            text={riwayat.certificateNumber}
            empty="Tanpa nomor surat"
          />
        ),
      },
      {
        key: "place",
        header: "Tempat",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (riwayat) => (
          <OptionalText text={riwayat.place} empty="Tanpa tempat" />
        ),
      },
    ],
    getRowHref: isCanUpdate
      ? (riwayat) => editHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT, riwayat.id)
      : undefined,
    getRowLabel: rowLabel,
    onRowOpen: (riwayat) => saveListFocus(RIWAYAT_LIST_PATH, riwayat.id),
    rowIcon: <Pencil />,
  };
}
