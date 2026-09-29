"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";
import { monthOptions } from "@/lib/date";

import { useReceiptList } from "../api";
import { RECEIPT_CREATE_PATH } from "../model";

import { ReceiptListItemRow, receiptTable } from "./list-item";

const LIST_FILTERS = {
  bulan: { api: "bulan" },
} satisfies ListFilterSchema;

export const ReceiptListContent = () => {
  const { isCanCreate } = useMenuAccess(MENU.PENERIMAAN_BARANG);
  const listParams = useListParams({ filters: LIST_FILTERS });
  const receiptList = useReceiptList(listParams);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Penerimaan Barang"
        subtitle={
          receiptList.totalData === undefined
            ? undefined
            : `${receiptList.totalData} penerimaan`
        }
        backHref={domainHref(MENU.PENGADAAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={RECEIPT_CREATE_PATH}
              label="Catat penerimaan barang"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari penerimaan barang"
        searchPlaceholder="Cari kode, pesanan, atau supplier"
        filters={[
          {
            key: "bulan",
            label: "Bulan",
            kind: "select",
            options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
          },
        ]}
      />

      <DataList
        items={receiptList.items}
        getKey={(receipt) => receipt.code}
        label="Daftar penerimaan barang"
        isLoading={receiptList.isLoading}
        isRefreshing={receiptList.isRefreshing}
        error={receiptList.error}
        onRetry={receiptList.onRetry}
        emptyTitle={
          isNarrowed
            ? "Tidak ada penerimaan barang"
            : "Belum ada penerimaan barang"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada penerimaan barang yang cocok dengan pencarian atau filter ini."
            : "Catat barang yang tiba dari supplier untuk sebuah pesanan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={receiptList.pagination}
        table={receiptTable()}
        itemNoun="penerimaan"
      >
        {(receipt) => <ReceiptListItemRow receipt={receipt} />}
      </DataList>
    </div>
  );
};
