"use client";

import { DateField } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { FormField } from "@/components/common/form";
import {
  CsvDownloadButton,
  DataList,
  DataListRow,
  type DataTableConfig,
} from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";

import { useApAgeing } from "./api";
import { onDownloadAgeing } from "./csv";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  NO_VIEW_DESCRIPTION,
  NO_VIEW_TITLE,
  POSTING_NOTE,
  TITLE,
  money,
  readDate,
} from "./model";
import { BUCKETS, type ApAgeingRow } from "./types";

const FILTERS = { tanggal: { api: "tanggal" } };

const ageingTable = (): DataTableConfig<ApAgeingRow> => ({
  columns: [
    {
      key: "supplier",
      header: "Supplier",
      width: "minmax(0,2.4fr)",
      cell: (row) => (
        <span className="block truncate" title={row.supplier.name}>
          {row.supplier.name}
        </span>
      ),
    },
    ...BUCKETS.map((bucket) => ({
      key: bucket.key,
      header: bucket.label,
      width: "minmax(0,1.5fr)",
      align: "end" as const,
      cell: (row: ApAgeingRow) => (
        <span className="block truncate tabular-nums">
          {Number(row.buckets[bucket.key]) === 0
            ? "—"
            : money(row.buckets[bucket.key])}
        </span>
      ),
    })),
    {
      key: "total",
      header: "Jumlah",
      width: "minmax(0,1.6fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate font-medium tabular-nums">
          {money(row.total)}
        </span>
      ),
    },
  ],
});

const metaOf = (row: ApAgeingRow) =>
  [
    `${row.invoiceCount} faktur`,
    row.oldestDueDate
      ? `terlama jatuh tempo ${formatDate(row.oldestDueDate)}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

export const LaporanUtangScreen = () => {
  const { isCanView } = useMenuAccess(MENU.AP_AGING);
  const listParams = useListParams({ filters: FILTERS });
  const date = readDate(listParams.filters.tanggal);
  const ageing = useApAgeing(date);
  const totals = ageing.data?.totals;

  if (!isCanView) {
    return (
      <div className="pb-6">
        <PageHeader title={TITLE} backHref={domainHref(MENU.REPORT)} />
        <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <PageHeader
        title={TITLE}
        subtitle={
          totals === undefined
            ? undefined
            : `${money(totals.total)} per ${formatDate(date)}`
        }
        backHref={domainHref(MENU.REPORT)}
        action={
          <CsvDownloadButton
            onDownload={() => onDownloadAgeing(date, ageing.data?.rows ?? [])}
          />
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,18rem))] gap-3 px-gutter pb-4 print:hidden">
        <FormField label="Posisi tanggal" htmlFor="umur-utang-date">
          <DateField
            id="umur-utang-date"
            value={date}
            onValueChange={(value) => listParams.onPickFilter("tanggal", value)}
            max={todayJakarta()}
            isClearable={false}
            label="Posisi tanggal"
          />
        </FormField>
      </div>

      <p className="text-muted-foreground px-gutter pb-4 text-body">
        {POSTING_NOTE}
      </p>

      <DataList
        loadingShape="trailing"
        items={ageing.data?.rows}
        getKey={(row) => String(row.supplier.id)}
        label="Umur utang per supplier"
        isLoading={ageing.isPending}
        isRefreshing={ageing.isFetching}
        error={ageing.error}
        onRetry={() => void ageing.refetch()}
        emptyTitle={EMPTY_TITLE}
        emptyDescription={EMPTY_DESCRIPTION}
        table={ageingTable()}
        itemNoun="supplier"
      >
        {(row) => (
          <DataListRow
            title={row.supplier.name}
            meta={metaOf(row)}
            trailing={
              <span className="text-body font-semibold tabular-nums">
                {money(row.total)}
              </span>
            }
          />
        )}
      </DataList>

      {totals ? (
        <section className="px-gutter pt-4">
          <dl className="border-hairline divide-hairline divide-y rounded-lg border px-4">
            {BUCKETS.map((bucket) => (
              <div
                key={bucket.key}
                className="flex items-center justify-between gap-3 py-2"
              >
                <dt className="text-muted-foreground text-body">
                  {bucket.label}
                </dt>
                <dd className="text-body tabular-nums">
                  {money(totals.buckets[bucket.key])}
                </dd>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 py-2">
              <dt className="text-body font-semibold">Jumlah utang</dt>
              <dd className="text-body font-semibold tabular-nums">
                {money(totals.total)}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
};
