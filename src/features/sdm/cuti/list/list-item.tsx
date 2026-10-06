import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { MENU, detailHref } from "@/config/menu";
import { formatDays } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { CUTI_LIST_PATH, rangeTextOf } from "../model";
import type { Cuti } from "../types";
import { CutiStatusBadge } from "../ui";

const detailHrefOf = (row: Cuti) => detailHref(MENU.SDM, MENU.CUTI, row.code);

const saveFocus = (row: Cuti) => saveListFocus(CUTI_LIST_PATH, row.code);

const labelOf = (row: Cuti) => `Buka cuti ${row.karyawan.name} ${row.code}`;

/**
 * Nol alasan di baris, kolom, atau tooltip (SDM README §0.3 no. 4). Tipe cuti
 * boleh karena bendahara harus bisa membedakan cuti tahunan dari melahirkan;
 * alasannya tidak, dan hanya halaman detail yang merendernya.
 */
const metaOf = (row: Cuti) =>
  `${row.leaveType.name} · ${rangeTextOf(row.startDate, row.endDate)} · ${formatDays(row.totalDays)}`;

interface PropTypes {
  cuti: Cuti;
}

export const CutiListItem = (props: PropTypes) => {
  const { cuti } = props;

  return (
    <DataListRow
      id={cuti.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(cuti)}
          onClick={() => saveFocus(cuti)}
          aria-label={labelOf(cuti)}
          className={TABLE_ROW_LINK}
        >
          {cuti.karyawan.name}
        </Link>
      }
      meta={metaOf(cuti)}
      trailing={<CutiStatusBadge cuti={cuti} />}
    />
  );
};

export function cutiTable(): DataTableConfig<Cuti> {
  return {
    columns: [
      {
        key: "karyawan",
        header: "Karyawan",
        width: "minmax(0,2.5fr)",
        narrowWidth: "minmax(0,2.5fr)",
        cell: (row) => (
          <span
            className="block truncate font-medium"
            title={row.karyawan.name}
          >
            {row.karyawan.name}
          </span>
        ),
      },
      {
        key: "leaveType",
        header: "Tipe",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.5fr)",
        cell: (row) => (
          <span className="block truncate" title={row.leaveType.name}>
            {row.leaveType.name}
          </span>
        ),
      },
      {
        key: "range",
        header: "Tanggal",
        width: "minmax(0,2fr)",
        narrowWidth: "minmax(0,2fr)",
        cell: (row) => (
          <span className="text-muted-foreground block truncate">
            {rangeTextOf(row.startDate, row.endDate)}
          </span>
        ),
      },
      {
        key: "totalDays",
        header: "Hari",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1fr)",
        cell: (row) => (
          <span className="block truncate tabular-nums">
            {formatDays(row.totalDays)}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        isSecondary: true,
        cell: (row) => (
          <span className="text-muted-foreground block truncate tabular-nums">
            {row.code}
          </span>
        ),
      },
      {
        // Lantai `rem`, bukan hanya `fr`: "Sedang ditandatangani" (21 karakter)
        // adalah teks status terpanjang di aplikasi, dan chip-nya
        // `shrink-0 whitespace-nowrap` di atas `overflow-visible` — ia tidak
        // bisa menyusut dan tidak bisa dipotong, jadi kolom `fr` murni
        // membuatnya meluber ke chevron baris di 768–1344.
        key: "status",
        header: "Status",
        width: "minmax(10rem,1.2fr)",
        narrowWidth: "minmax(10rem,1.2fr)",
        cell: (row) => <CutiStatusBadge cuti={row} />,
      },
    ],
    getRowHref: detailHrefOf,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
