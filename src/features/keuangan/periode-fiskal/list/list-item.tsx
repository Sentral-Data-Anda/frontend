import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  PERIODE_FISKAL_LIST_PATH,
  draftText,
  periodHref,
  rangeText,
} from "../model";
import type { FiscalPeriod } from "../types";
import { PeriodStatus } from "../ui";

const EMPTY = "—";

const keyOf = (period: FiscalPeriod) => period.id;

const saveFocus = (period: FiscalPeriod) =>
  saveListFocus(PERIODE_FISKAL_LIST_PATH, keyOf(period));

const hrefOf = (period: FiscalPeriod) => periodHref(period.id);

const labelOf = (period: FiscalPeriod) => `Lihat periode ${period.label}`;

interface PropTypes {
  period: FiscalPeriod;
}

export const PeriodListItemRow = (props: PropTypes) => {
  const { period } = props;

  return (
    <DataListRow
      id={keyOf(period)}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={hrefOf(period)}
          onClick={() => saveFocus(period)}
          aria-label={labelOf(period)}
          className={TABLE_ROW_LINK}
        >
          {period.label}
        </Link>
      }
      meta={rangeText(period)}
      trailing={
        <span className="flex flex-col items-end gap-0.5">
          <PeriodStatus status={period.status} />
          {period.draftCount > 0 ? (
            <Badge variant="warning">{draftText(period.draftCount)}</Badge>
          ) : null}
        </span>
      }
    />
  );
};

export function periodTable(): DataTableConfig<FiscalPeriod> {
  return {
    columns: [
      {
        key: "label",
        header: "Bulan",
        width: "minmax(0,1.5fr)",
        cell: (period) => (
          <span className="block truncate font-medium">{period.label}</span>
        ),
      },
      {
        key: "range",
        header: "Rentang",
        width: "minmax(0,2fr)",
        cell: (period) => (
          <span className="block truncate tabular-nums">
            {rangeText(period)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "minmax(0,1fr)",
        cell: (period) => <PeriodStatus status={period.status} />,
      },
      {
        key: "draftCount",
        header: "Draf",
        width: "minmax(0,0.8fr)",
        align: "end",
        cell: (period) =>
          period.draftCount > 0 ? (
            <Badge variant="warning">{draftText(period.draftCount)}</Badge>
          ) : (
            <span className="text-muted-foreground tabular-nums">{EMPTY}</span>
          ),
      },
      {
        key: "closedBy",
        header: "Ditutup oleh",
        width: "minmax(0,1.5fr)",
        isSecondary: true,
        cell: (period) => (
          <span className="block truncate">
            {period.closedBy?.name ?? EMPTY}
          </span>
        ),
      },
    ],
    getRowHref: hrefOf,
    getRowLabel: labelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
