import { OptionalText } from "@/components/common/display";
import { DataListRow, type DataTableConfig } from "@/components/common/list";
import { MENU, editHref } from "@/config/menu";
import { formatDate, formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { RIWAYAT_LIST_PATH } from "../model";
import { SACRAMENT_TYPE_LABEL, type RiwayatJemaat } from "../types";

const typeLabel = (riwayat: RiwayatJemaat) =>
  SACRAMENT_TYPE_LABEL[riwayat.type];

const rowLabel = (riwayat: RiwayatJemaat) =>
  `Ubah riwayat ${typeLabel(riwayat).toLowerCase()} ${riwayat.jemaat.name}`;

interface PropTypes {
  riwayat: RiwayatJemaat;
}

export const RiwayatListItemRow = (props: PropTypes) => {
  const { riwayat } = props;

  return (
    <DataListRow
      id={riwayat.id}
      title={riwayat.jemaat.name}
      meta={`${typeLabel(riwayat)} · ${formatDate(riwayat.date)}`}
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
        </>
      }
    />
  );
};

const deleteLabelOf = (x: RiwayatJemaat) =>
  `Hapus riwayat ${typeLabel(x).toLowerCase()} ${x.jemaat.name}`;

export const deleteTargetLabelOf = (x: RiwayatJemaat) =>
  `${typeLabel(x)} ${x.jemaat.name}`;

export function riwayatTable(
  isCanUpdate: boolean,
  onDelete?: (row: RiwayatJemaat) => void,
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
        cell: typeLabel,
      },
      {
        key: "date",
        header: "Tanggal",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (riwayat) => (
          <span className="tabular-nums">{formatDateShort(riwayat.date)}</span>
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
    getRowActions: (x) => ({
      label: rowLabel(x),
      edit: {
        href: isCanUpdate
          ? editHref(MENU.KEJEMAATAN, MENU.RIWAYAT_JEMAAT, x.id)
          : undefined,
        onNavigate: () => saveListFocus(RIWAYAT_LIST_PATH, x.id),
        label: rowLabel(x),
      },
      remove: onDelete
        ? { onSelect: () => onDelete(x), label: deleteLabelOf(x) }
        : undefined,
    }),
  };
}
