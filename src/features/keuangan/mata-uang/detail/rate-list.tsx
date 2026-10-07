"use client";

import { Pencil } from "lucide-react";

import {
  DataList,
  DataListRow,
  ListToolbar,
  type DataTableConfig,
} from "@/components/common/list";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";
import { formatDate } from "@/lib/format";

import { useRateList } from "../api";
import {
  RATE_FILTERS,
  RATE_SOURCE_LABEL,
  formatRate,
  rateEditHref,
  rateLabelOf,
  saveRateFocus,
} from "../model";
import type { Rate } from "../types";

import { RateEditLink } from "./rate-edit-link";

const rateTable = (isCanUpdate: boolean): DataTableConfig<Rate> => ({
  columns: [
    {
      key: "rateDate",
      header: "Tanggal",
      width: "minmax(0,1.2fr)",
      cell: (rate) => (
        <span className="block truncate tabular-nums">
          {formatDate(rate.rateDate)}
        </span>
      ),
    },
    {
      key: "rate",
      header: "Kurs",
      width: "minmax(0,1.5fr)",
      align: "end",
      cell: (rate) => (
        <span className="block truncate font-medium tabular-nums">
          {formatRate(rate.rate)}
        </span>
      ),
    },
    {
      key: "source",
      header: "Sumber",
      width: "minmax(0,1fr)",
      cell: (rate) => (
        <span className="block truncate">{RATE_SOURCE_LABEL[rate.source]}</span>
      ),
    },
  ],
  getRowHref: isCanUpdate
    ? (rate) => rateEditHref(rate.currencyCode, rate.id)
    : undefined,
  getRowLabel: rateLabelOf,
  onRowOpen: saveRateFocus,
  rowIcon: <Pencil />,
});

interface PropTypes {
  currencyCode: string;
  isCanUpdate: boolean;
}

export const RateList = (props: PropTypes) => {
  const { currencyCode, isCanUpdate } = props;

  const listParams = useListParams({ filters: RATE_FILTERS });
  const rateList = useRateList(currencyCode, listParams);
  const months = [{ value: "", label: "Semua bulan" }, ...monthOptions()];

  return (
    <section aria-labelledby="rate-list" className="pt-6">
      <h2 id="rate-list" className="px-gutter pb-3 text-title font-semibold">
        Kurs
      </h2>

      <ListToolbar
        listParams={listParams}
        filters={[
          { key: "bulan", label: "Bulan", kind: "select", options: months },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={rateList.items}
        getKey={(rate) => String(rate.id)}
        label={`Daftar kurs ${currencyCode}`}
        isLoading={rateList.isLoading}
        isRefreshing={rateList.isRefreshing}
        error={rateList.error}
        onRetry={rateList.onRetry}
        emptyTitle={
          listParams.isFiltered
            ? "Tidak ada kurs di bulan ini"
            : "Belum ada kurs"
        }
        emptyDescription={
          listParams.isFiltered
            ? "Pilih bulan lain atau hapus filter."
            : `Tambahkan kurs agar pesanan dalam ${currencyCode} bisa dihitung ke Rupiah.`
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={rateList.pagination}
        table={rateTable(isCanUpdate)}
        itemNoun="kurs"
      >
        {(rate) => (
          <DataListRow
            id={String(rate.id)}
            title={
              <span className="tabular-nums">{formatRate(rate.rate)}</span>
            }
            meta={`${formatDate(rate.rateDate)} · ${RATE_SOURCE_LABEL[rate.source]}`}
            trailing={isCanUpdate ? <RateEditLink rate={rate} /> : null}
          />
        )}
      </DataList>
    </section>
  );
};
