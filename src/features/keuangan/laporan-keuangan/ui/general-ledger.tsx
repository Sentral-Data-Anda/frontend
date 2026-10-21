"use client";

import Link from "next/link";

import { AccountField } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { FormField } from "@/components/common/form";
import {
  CsvDownloadButton,
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import type { ListLimit } from "@/hooks/use-list-params";
import { FetchError } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";

import { fetchAllLedgerRows, useLedger } from "../api";
import { onDownloadLedger, rangeFileName } from "../csv";
import {
  LEDGER_EMPTY_DESCRIPTION,
  LEDGER_EMPTY_TITLE,
  LEDGER_NOTE,
  LEDGER_NO_ROW_DESCRIPTION,
  LEDGER_NO_ROW_TITLE,
  journalHref,
  money,
  rangeLabel,
} from "../model";
import type { LedgerRow, ReportRange } from "../types";

import { LedgerBalance } from "./ledger-balance";
import { PeriodFields } from "./period-fields";
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
  getRowActions: (row) => ({
    label: `Entri jurnal ${row.entryCode}`,
    // Label aksi diisi penuh supaya nama tautannya tetap "Entri jurnal X",
    // bukan "Lihat Entri jurnal X".
    view: {
      href: toHref?.(row),
      label: `Entri jurnal ${row.entryCode}`,
    },
  }),
});

interface PropTypes {
  code: string;
  range: ReportRange;
  page: number;
  limit: ListLimit;
  onPickAccount: (code: string) => void;
  onPickFrom: (value: string) => void;
  onPickTo: (value: string) => void;
  onPickPage: (page: number) => void;
  onPickLimit: (limit: ListLimit) => void;
}

export const GeneralLedger = (props: PropTypes) => {
  const {
    code,
    range,
    page,
    limit,
    onPickAccount,
    onPickFrom,
    onPickTo,
    onPickPage,
    onPickLimit,
  } = props;

  const journalAccess = useMenuAccess(MENU.JOURNAL_ENTRY);
  const isExporting = useBoolean();
  const accounts = useDdlOptions<AccountOption>("account");
  const ledger = useLedger({
    code,
    from: range.from,
    to: range.to,
    page,
    limit,
  });
  const picked = accounts.rows.find((row) => row.code === code);
  const isMissing =
    ledger.error instanceof FetchError && ledger.error.status === 404;
  const periodLabel = rangeLabel(range);
  const rows = ledger.data?.rows.map((row, index) => ({
    ...row,
    key: `${page}-${index}`,
  }));
  const toHref = (row: Row) =>
    journalAccess.isCanView && row.entryPublicId
      ? journalHref(row.entryPublicId)
      : undefined;

  const onExportCsv = async () => {
    isExporting.onTrue();

    try {
      onDownloadLedger(
        ["Buku-Besar", code, rangeFileName(range)],
        await fetchAllLedgerRows({ code, from: range.from, to: range.to }),
      );
    } finally {
      isExporting.onFalse();
    }
  };

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

        <PeriodFields
          idPrefix="buku-besar"
          range={range}
          onPickFrom={onPickFrom}
          onPickTo={onPickTo}
        />

        {code ? (
          <CsvDownloadButton
            isPending={isExporting.value}
            onDownload={() => void onExportCsv()}
          />
        ) : null}
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
            {periodLabel}
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
