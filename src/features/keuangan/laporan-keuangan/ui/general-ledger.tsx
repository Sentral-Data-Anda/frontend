"use client";

import Link from "next/link";

import { AccountField, SelectField } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { FormField } from "@/components/common/form";
import {
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { FetchError } from "@/lib/api/fetcher";
import { monthOptions, monthRange } from "@/lib/date";
import { formatDate } from "@/lib/format";

import { useLedger } from "../api";
import {
  LEDGER_EMPTY_DESCRIPTION,
  LEDGER_EMPTY_TITLE,
  LEDGER_NOTE,
  LEDGER_NO_ROW_DESCRIPTION,
  LEDGER_NO_ROW_TITLE,
  journalHref,
  money,
} from "../model";
import type { LedgerRow } from "../types";

import { LedgerBalance } from "./ledger-balance";
import { ReportFilters } from "./report-filters";

type AccountOption = { id: number; code: string; name: string };

type Row = LedgerRow & { key: string };

const ROW_LINK =
  "focus-visible:ring-ring inline-block min-h-9 max-w-full truncate rounded-sm align-middle leading-9 underline-offset-4 outline-none hover:underline focus-visible:ring-2";

const metaOf = (row: Row) =>
  [
    formatDate(row.entryDate),
    row.entryCode,
    Number(row.debit) === 0
      ? `Kredit ${money(row.credit)}`
      : `Debit ${money(row.debit)}`,
  ].join(" \u00b7 ");

export const ledgerTable = (
  toHref?: (row: Row) => string | undefined,
): DataTableConfig<Row> => ({
  columns: [
    {
      key: "entryDate",
      header: "Tanggal",
      width: "minmax(0,1.3fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {formatDate(row.entryDate)}
        </span>
      ),
    },
    {
      key: "entryCode",
      header: "Kode entri",
      width: "minmax(0,1.4fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate tabular-nums">
          {row.entryCode}
        </span>
      ),
    },
    {
      key: "description",
      header: "Keterangan",
      width: "minmax(0,2.5fr)",
      cell: (row) => (
        <span className="block truncate" title={row.description}>
          {row.description}
        </span>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      width: "minmax(0,1.4fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {Number(row.debit) === 0 ? "\u2014" : money(row.debit)}
        </span>
      ),
    },
    {
      key: "credit",
      header: "Kredit",
      width: "minmax(0,1.4fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {Number(row.credit) === 0 ? "\u2014" : money(row.credit)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Saldo berjalan",
      width: "minmax(0,1.6fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate font-medium tabular-nums">
          {money(row.balance)}
        </span>
      ),
    },
  ],
  getRowHref: toHref,
  getRowLabel: (row) => `Entri jurnal ${row.entryCode}`,
});

interface PropTypes {
  code: string;
  month: string;
  page: number;
  limit: number;
  onPickAccount: (code: string) => void;
  onPickMonth: (value: string) => void;
  onPickPage: (page: number) => void;
  onPickLimit: (limit: number) => void;
}

export const GeneralLedger = (props: PropTypes) => {
  const {
    code,
    month,
    page,
    limit,
    onPickAccount,
    onPickMonth,
    onPickPage,
    onPickLimit,
  } = props;

  const journalAccess = useMenuAccess(MENU.JOURNAL_ENTRY);
  const accounts = useDdlOptions<AccountOption>("account");
  const range = monthRange(month);
  const ledger = useLedger({
    code,
    from: range.startDate,
    to: range.endDate,
    page,
    limit,
  });
  const picked = accounts.rows.find((row) => row.code === code);
  const isMissing =
    ledger.error instanceof FetchError && ledger.error.status === 404;
  const monthLabel =
    monthOptions().find((option) => option.value === month)?.label ?? month;
  const rows = ledger.data?.rows.map((row, index) => ({
    ...row,
    key: `${page}-${index}`,
  }));
  const toHref = (row: Row) =>
    journalAccess.isCanView && row.entryPublicId
      ? journalHref(row.entryPublicId)
      : undefined;

  const onPickId = (value: string) =>
    onPickAccount(
      accounts.rows.find((row) => String(row.id) === value)?.code ?? "",
    );

  return (
    <div className="pb-6">
      <ReportFilters>
        <FormField label="Akun" htmlFor="buku-besar-account">
          <AccountField
            value={picked ? String(picked.id) : ""}
            onValueChange={onPickId}
          />
        </FormField>

        <FormField label="Bulan" htmlFor="buku-besar-month">
          <SelectField
            value={month}
            onValueChange={onPickMonth}
            options={monthOptions()}
          />
        </FormField>
      </ReportFilters>

      <p className="text-muted-foreground px-gutter pb-4 text-body print:hidden">
        {LEDGER_NOTE}
      </p>

      {!code ? (
        <EmptyState
          title={LEDGER_EMPTY_TITLE}
          description={LEDGER_EMPTY_DESCRIPTION}
        />
      ) : isMissing ? (
        <EmptyState
          title="Akun tidak ditemukan"
          description={`Akun ${code} sudah tidak ada. Pilih akun lain untuk melihat buku besarnya.`}
        />
      ) : (
        <div className="space-y-3">
          <h2 className="hidden px-gutter text-lead font-semibold print:block">
            Buku Besar {ledger.data?.account.code} {ledger.data?.account.name} ·{" "}
            {monthLabel}
          </h2>

          <div className="px-gutter">
            <LedgerBalance
              label="Saldo awal"
              amount={ledger.data?.openingBalance}
            />
          </div>

          <div className="print:[&_[role=combobox]]:hidden print:[&_label]:hidden print:[&_nav]:hidden">
            <DataList
              loadingShape="trailing"
              items={rows}
              getKey={(row) => row.key}
              label={`Buku besar ${code}`}
              isLoading={ledger.isPending}
              isRefreshing={ledger.isFetching}
              error={ledger.error}
              onRetry={() => void ledger.refetch()}
              emptyTitle={LEDGER_NO_ROW_TITLE}
              emptyDescription={LEDGER_NO_ROW_DESCRIPTION}
              table={ledgerTable(toHref)}
              pagination={{
                mode: "pages",
                page,
                totalPage: ledger.data?.totalPage ?? 0,
                onPickPage,
                totalData: ledger.data?.totalData,
                limit,
                onPickLimit,
              }}
              itemNoun="baris"
            >
              {(row) => (
                <DataListRow
                  title={
                    toHref(row) ? (
                      <Link href={toHref(row)!} className={ROW_LINK}>
                        {row.description}
                      </Link>
                    ) : (
                      row.description
                    )
                  }
                  meta={metaOf(row)}
                  trailing={
                    <span className="text-body font-semibold tabular-nums">
                      {money(row.balance)}
                    </span>
                  }
                />
              )}
            </DataList>
          </div>

          <div className="px-gutter">
            <LedgerBalance
              label="Saldo akhir"
              amount={ledger.data?.closingBalance}
            />
          </div>
        </div>
      )}
    </div>
  );
};
