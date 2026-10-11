"use client";

import { Coins, Scale, TrendingDown } from "lucide-react";

import { DateField } from "@/components/common/control";
import { KpiCell, KpiStrip } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { FormField } from "@/components/common/form";
import {
  CsvDownloadButton,
  DataList,
  DataListRow,
} from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useBoolean } from "@/hooks/use-boolean";
import { useListParams } from "@/hooks/use-list-params";
import { todayJakarta } from "@/lib/date";
import { formatDate } from "@/lib/format";

import { fetchAllRegisterRows, useAssetRegister } from "./api";
import { onDownloadRegister } from "./csv";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  NO_VIEW_DESCRIPTION,
  NO_VIEW_TITLE,
  PAGE_TOTAL_NOTE,
  TITLE,
  money,
  readDate,
} from "./model";
import { registerTable } from "./register-table";
import type { AssetRegisterRow } from "./types";

const FILTERS = { tanggal: { api: "tanggal" } };

const metaOf = (row: AssetRegisterRow) =>
  [
    row.code,
    row.type.name,
    row.acquisitionDate ? formatDate(row.acquisitionDate) : "tanpa tanggal",
  ].join(" · ");

export const LaporanAsetScreen = () => {
  const { isCanView } = useMenuAccess(MENU.ASSET_REPORT);
  const listParams = useListParams({ filters: FILTERS });
  const date = readDate(listParams.filters.tanggal);
  const isExporting = useBoolean();

  const register = useAssetRegister({
    date,
    page: listParams.page,
    limit: listParams.limit,
  });
  const totals = register.data?.pageTotals;

  const onExportCsv = async () => {
    isExporting.onTrue();

    try {
      onDownloadRegister(date, await fetchAllRegisterRows(date));
    } finally {
      isExporting.onFalse();
    }
  };

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
          register.data === undefined
            ? undefined
            : `${register.data.totalData} aset per ${formatDate(date)}`
        }
        backHref={domainHref(MENU.REPORT)}
        action={
          <CsvDownloadButton
            isPending={isExporting.value}
            onDownload={() => void onExportCsv()}
          />
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,18rem))] gap-3 px-gutter pb-4 print:hidden">
        <FormField label="Posisi tanggal" htmlFor="laporan-aset-date">
          <DateField
            id="laporan-aset-date"
            value={date}
            onValueChange={(value) => listParams.onPickFilter("tanggal", value)}
            max={todayJakarta()}
            isClearable={false}
            label="Posisi tanggal"
          />
        </FormField>
      </div>

      <DataList
        loadingShape="trailing"
        items={register.data?.rows}
        getKey={(row) => row.publicId}
        label="Daftar aset tetap"
        isLoading={register.isPending}
        isRefreshing={register.isFetching}
        error={register.error}
        onRetry={() => void register.refetch()}
        emptyTitle={EMPTY_TITLE}
        emptyDescription={EMPTY_DESCRIPTION}
        table={registerTable()}
        pagination={{
          mode: "pages",
          page: listParams.page,
          totalPage: register.data?.totalPage ?? 0,
          onPickPage: listParams.onPickPage,
          totalData: register.data?.totalData,
          limit: listParams.limit,
          onPickLimit: listParams.onPickLimit,
        }}
        itemNoun="aset"
      >
        {(row) => (
          <DataListRow
            title={row.name}
            meta={metaOf(row)}
            trailing={
              <span className="text-body font-semibold tabular-nums">
                {money(row.bookValue)}
              </span>
            }
          />
        )}
      </DataList>

      <div className="px-gutter pt-4">
        <KpiStrip label="Jumlah halaman ini">
          {[
            {
              key: "cost",
              label: "Harga perolehan",
              icon: Coins,
              value: totals?.acquisitionCost,
            },
            {
              key: "accumulated",
              label: "Akumulasi penyusutan",
              icon: TrendingDown,
              value: totals?.accumulated,
            },
            {
              key: "book",
              label: "Nilai buku",
              icon: Scale,
              value: totals?.bookValue,
            },
          ].map((cell) => (
            <KpiCell
              key={cell.key}
              label={cell.label}
              icon={cell.icon}
              value={money(cell.value)}
              hint={PAGE_TOTAL_NOTE}
              isLoading={register.isPending}
              isError={Boolean(register.error)}
            />
          ))}
        </KpiStrip>
      </div>
    </div>
  );
};
