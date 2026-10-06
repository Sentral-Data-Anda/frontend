import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmount } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import { LIST_PATH, periodLabel, runHref } from "../model";
import type { PayrollRun } from "../types";
import { PayrollStatusBadge } from "../ui";

const saveFocus = (run: PayrollRun) => saveListFocus(LIST_PATH, run.code);

const labelOf = (run: PayrollRun) =>
  `Buka penggajian ${periodLabel(run)} ${run.code}`;

const hrefOf = (run: PayrollRun) => runHref(run.code);

/**
 * NOL NAMA di baris mana pun (§0.3 no. 3). Yang tampil periode dan agregat run;
 * angka per orang satu klik ke bawah, di halaman yang harus sengaja dibuka.
 */
const metaOf = (run: PayrollRun) =>
  `${run.code} · Bersih ${formatAmount(run.totalNet)}`;

const money = (value: string, className = "") => (
  <span
    className={`block truncate tabular-nums ${className}`}
    title={formatAmount(value)}
  >
    {formatAmount(value)}
  </span>
);

interface PropTypes {
  run: PayrollRun;
}

export const PayrollListItem = (props: PropTypes) => {
  const { run } = props;

  return (
    <DataListRow
      id={run.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={hrefOf(run)}
          onClick={() => saveFocus(run)}
          aria-label={labelOf(run)}
          className={TABLE_ROW_LINK}
        >
          {periodLabel(run)}
        </Link>
      }
      meta={metaOf(run)}
      trailing={<PayrollStatusBadge status={run.status} />}
    />
  );
};

export function payrollTable(): DataTableConfig<PayrollRun> {
  return {
    columns: [
      {
        key: "period",
        header: "Periode",
        width: "minmax(0,1.8fr)",
        narrowWidth: "minmax(0,1.8fr)",
        cell: (run) => (
          <span className="block truncate font-medium" title={periodLabel(run)}>
            {periodLabel(run)}
          </span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1fr)",
        narrowWidth: "minmax(0,1.1fr)",
        cell: (run) => (
          <span className="text-muted-foreground block truncate tabular-nums">
            {run.code}
          </span>
        ),
      },
      {
        key: "totalGross",
        header: "Bruto",
        width: "minmax(0,1.5fr)",
        align: "end",
        isSecondary: true,
        cell: (run) => money(run.totalGross, "text-muted-foreground"),
      },
      {
        key: "totalDeduction",
        header: "Potongan",
        width: "minmax(0,1.5fr)",
        align: "end",
        isSecondary: true,
        cell: (run) => money(run.totalDeduction, "text-muted-foreground"),
      },
      {
        key: "totalNet",
        header: "Bersih",
        width: "minmax(0,1.5fr)",
        narrowWidth: "minmax(0,1.6fr)",
        align: "end",
        cell: (run) => money(run.totalNet, "font-medium"),
      },
      {
        // Lantai `rem`, bukan `fr` murni: "Menunggu persetujuan" adalah teks
        // chip terpanjang di layar ini dan chip-nya `shrink-0 whitespace-nowrap`
        // — kolom `fr` murni membuatnya meluber ke chevron baris.
        key: "status",
        header: "Status",
        width: "minmax(10.5rem,1.2fr)",
        narrowWidth: "minmax(10.5rem,1.2fr)",
        cell: (run) => <PayrollStatusBadge status={run.status} />,
      },
    ],
    getRowHref: hrefOf,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
