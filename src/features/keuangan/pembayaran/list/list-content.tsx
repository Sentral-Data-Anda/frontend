"use client";

import { DataList, ListTabs, ListToolbar } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useListParams } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { PAYMENT_FILTERS, usePaymentList } from "../api";
import {
  EMPTY_DESCRIPTION,
  EMPTY_TITLE,
  PURPOSE_FILTER_OPTIONS,
  STATUS_TABS,
} from "../model";

import { PaymentListItem, paymentTable } from "./list-item";
import { PostingNote } from "./posting-note";

const MONTH_OPTIONS = [
  { value: "", label: "30 hari terakhir" },
  ...monthOptions(),
];

export const PaymentListContent = () => {
  const listParams = useListParams({ filters: PAYMENT_FILTERS });
  const paymentList = usePaymentList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Payment"
        subtitle={
          paymentList.totalData === undefined
            ? undefined
            : `${paymentList.totalData} pembayaran`
        }
        backHref={domainHref(MENU.FINANCE)}
      />

      <PostingNote />

      <ListTabs
        label="Status pembayaran"
        value={listParams.status}
        options={STATUS_TABS}
        onValueChange={(status) => listParams.onPickFilter("status", status)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari pembayaran"
        searchPlaceholder="Cari kode atau nama pemberi"
        filters={[
          {
            key: "tujuan",
            label: "Tujuan",
            kind: "select",
            options: PURPOSE_FILTER_OPTIONS,
          },
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: MONTH_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={paymentList.items}
        getKey={(row) => row.publicId}
        label="Daftar pembayaran"
        isLoading={paymentList.isLoading}
        isRefreshing={paymentList.isRefreshing}
        error={paymentList.error}
        onRetry={paymentList.onRetry}
        emptyTitle={isNarrowed ? "Tidak ada pembayaran" : EMPTY_TITLE}
        emptyDescription={
          isNarrowed
            ? "Tidak ada pembayaran yang cocok dengan filter ini."
            : EMPTY_DESCRIPTION
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={paymentList.pagination}
        table={paymentTable()}
        itemNoun="pembayaran"
      >
        {(row) => <PaymentListItem row={row} />}
      </DataList>
    </div>
  );
};
