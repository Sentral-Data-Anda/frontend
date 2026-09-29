"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  FormAlert,
  FormConfirmDialog,
  useFormConfirm,
} from "@/components/common/form";
import {
  DataList,
  DataListRow,
  ListToolbar,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";
import { formatDate } from "@/lib/format";

import { useDeleteRate, useRateList } from "../api";
import {
  RATE_FILTERS,
  RATE_SOURCE_LABEL,
  formatRate,
  rateDeleteText,
} from "../model";
import type { Rate } from "../types";

import { RateActions } from "./rate-actions";

type Column = DataTableColumn<Rate>;

const COLUMNS: Column[] = [
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
];

interface PropTypes {
  currencyCode: string;
  isCanUpdate: boolean;
  isCanDelete: boolean;
}

export const RateList = (props: PropTypes) => {
  const { currencyCode, isCanUpdate, isCanDelete } = props;

  const toast = useToast();
  const listParams = useListParams({ filters: RATE_FILTERS });
  const rateList = useRateList(currencyCode, listParams);
  const deleteRate = useDeleteRate();
  const confirm = useFormConfirm();
  const [pickRate, setPickRate] = useState<Rate | null>(null);
  const months = [{ value: "", label: "Semua bulan" }, ...monthOptions()];
  const isActions = isCanUpdate || isCanDelete;

  const onPickDelete = (rate: Rate) => {
    deleteRate.reset();
    setPickRate(rate);
    confirm.onOpen("delete");
  };

  const actionsOf = (rate: Rate) => (
    <RateActions
      rate={rate}
      isCanUpdate={isCanUpdate}
      isCanDelete={isCanDelete}
      isDisabled={deleteRate.isPending}
      onDelete={onPickDelete}
    />
  );

  const table: DataTableConfig<Rate> = {
    columns: isActions
      ? [
          ...COLUMNS,
          {
            key: "actions",
            header: "",
            width: "4.5rem",
            align: "end",
            cell: actionsOf,
          },
        ]
      : COLUMNS,
  };

  const onDelete = () => {
    if (!pickRate) return;

    deleteRate.mutate(pickRate.id, {
      onSuccess: (deleted) => toast.add({ title: deleted.message }),
    });
  };

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

      {deleteRate.error ? (
        <div className="px-gutter pb-4">
          <FormAlert
            title="Kurs belum terhapus."
            message={deleteRate.error.message}
          />
        </div>
      ) : null}

      <DataList
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
        table={table}
        itemNoun="kurs"
      >
        {(rate) => (
          <DataListRow
            id={String(rate.id)}
            title={
              <span className="tabular-nums">{formatRate(rate.rate)}</span>
            }
            meta={`${formatDate(rate.rateDate)} · ${RATE_SOURCE_LABEL[rate.source]}`}
            trailing={isActions ? actionsOf(rate) : null}
          />
        )}
      </DataList>

      <FormConfirmDialog
        confirm={confirm}
        noun="kurs"
        descriptions={
          pickRate
            ? { delete: rateDeleteText(currencyCode, pickRate.rateDate) }
            : undefined
        }
        onDelete={onDelete}
      />
    </section>
  );
};
