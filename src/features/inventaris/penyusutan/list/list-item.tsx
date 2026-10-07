import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { formatAmountCents, formatNumber } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  PENYUSUTAN_LIST_PATH,
  isCalculated,
  periodLabel,
  runHref,
} from "../model";
import type { Run } from "../types";
import { RunStatus } from "../ui";

const EMPTY = "—";

const saveFocus = (run: Run) => saveListFocus(PENYUSUTAN_LIST_PATH, run.code);

const hrefOf = (run: Run) => runHref(run.code);

const periodOf = (run: Run) => periodLabel(run.year, run.month);

const labelOf = (run: Run) => `Lihat penyusutan ${periodOf(run)}`;

const metaOf = (run: Run) =>
  isCalculated(run)
    ? `${run.code} · ${formatNumber(run.entryCount)} barang`
    : run.code;

interface PropTypes {
  run: Run;
}

export const PenyusutanListItemRow = (props: PropTypes) => {
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
          {periodOf(run)}
        </Link>
      }
      meta={metaOf(run)}
      trailing={
        <span className="flex flex-col items-end">
          {isCalculated(run) ? (
            <span className="text-body font-medium tabular-nums">
              {formatAmountCents(run.totalAmount)}
            </span>
          ) : null}
          <RunStatus run={run} />
        </span>
      }
    />
  );
};

export function penyusutanTable(): DataTableConfig<Run> {
  return {
    columns: [
      {
        key: "period",
        header: "Periode",
        width: "minmax(0,1.5fr)",
        cell: (run) => (
          <span className="block truncate font-medium">{periodOf(run)}</span>
        ),
      },
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,1.2fr)",
        cell: (run) => (
          <span className="block truncate tabular-nums">{run.code}</span>
        ),
      },
      {
        key: "entryCount",
        header: "Barang",
        width: "minmax(0,0.8fr)",
        align: "end",
        cell: (run) => (
          <span className="tabular-nums">
            {isCalculated(run) ? formatNumber(run.entryCount) : EMPTY}
          </span>
        ),
      },
      {
        key: "totalAmount",
        header: "Total",
        width: "minmax(0,1.2fr)",
        align: "end",
        cell: (run) => (
          <span className="tabular-nums">
            {isCalculated(run) ? formatAmountCents(run.totalAmount) : EMPTY}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        cell: (run) => <RunStatus run={run} />,
      },
    ],
    getRowHref: hrefOf,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
