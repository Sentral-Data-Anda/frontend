import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  MATA_UANG_LIST_PATH,
  currencyDetailHref,
  formatRate,
  latestRateLabel,
} from "../model";
import type { Currency } from "../types";

const saveFocus = (currency: Currency) =>
  saveListFocus(MATA_UANG_LIST_PATH, currency.code);

const detailHrefOf = (currency: Currency) => currencyDetailHref(currency.code);

const viewLabelOf = (currency: Currency) =>
  `Lihat mata uang ${currency.code} ${currency.name}`;

const BASE_BADGE = <Badge variant="secondary">Mata uang dasar</Badge>;

const NO_RATE = (
  <span className="text-muted-foreground block truncate">Belum ada kurs</span>
);

const rateCell = (currency: Currency) => {
  if (currency.isBase) return BASE_BADGE;
  if (!currency.latestRate) return NO_RATE;

  return (
    <span className="block truncate font-medium tabular-nums">
      {formatRate(currency.latestRate.rate)}
    </span>
  );
};

const rateDateCell = (currency: Currency) =>
  currency.latestRate ? (
    <span className="block truncate tabular-nums">
      {formatDateShort(currency.latestRate.rateDate)}
    </span>
  ) : (
    <span className="text-muted-foreground">—</span>
  );

interface PropTypes {
  currency: Currency;
}

export const CurrencyListItemRow = (props: PropTypes) => {
  const { currency } = props;

  return (
    <DataListRow
      id={currency.code}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(currency)}
          onClick={() => saveFocus(currency)}
          aria-label={viewLabelOf(currency)}
          className={TABLE_ROW_LINK}
        >
          {currency.code} — {currency.name}
        </Link>
      }
      meta={currency.symbol}
      trailing={
        currency.isBase ? (
          BASE_BADGE
        ) : (
          <span className="text-caption tabular-nums">
            {latestRateLabel(currency) ?? NO_RATE}
          </span>
        )
      }
    />
  );
};

export function currencyTable(): DataTableConfig<Currency> {
  return {
    columns: [
      {
        key: "code",
        header: "Kode",
        width: "minmax(0,0.8fr)",
        cell: (currency) => (
          <span className="block truncate font-medium">{currency.code}</span>
        ),
      },
      {
        key: "name",
        header: "Nama",
        width: "minmax(0,2fr)",
        cell: (currency) => (
          <span className="block truncate" title={currency.name}>
            {currency.name}
          </span>
        ),
      },
      {
        key: "symbol",
        header: "Simbol",
        width: "minmax(0,0.8fr)",
        cell: (currency) => (
          <span className="block truncate">{currency.symbol}</span>
        ),
      },
      {
        key: "rate",
        header: "Kurs terakhir",
        width: "minmax(0,1.5fr)",
        align: "end",
        cell: rateCell,
      },
      {
        key: "rateDate",
        header: "Tanggal kurs",
        width: "minmax(0,1.2fr)",
        cell: rateDateCell,
      },
    ],
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
