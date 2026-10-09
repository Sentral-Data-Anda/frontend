"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { useStockList } from "../api";
import {
  STOCK_CREATE_PATH,
  STOCK_FILTERS,
  STOCK_FILTER_OPTIONS,
} from "../model";

import { StockListItemRow, persediaanTable } from "./list-item";

const allOf = (label: string) => ({ value: "", label });

export const StockListContent = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.STOCK_ITEM);
  const listParams = useListParams({ filters: STOCK_FILTERS });
  const stockList = useStockList(listParams);
  const types = useDdlOptions("type-item", "id", listParams.filters.tipe);
  const rooms = useDdlOptions("room", "id", listParams.filters.ruang);
  const units = useDdlOptions("unit", "id", listParams.filters.satuan);
  const bapel = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  return (
    <div className="pb-6">
      <PageHeader
        title="Barang Persediaan"
        subtitle={
          stockList.totalData === undefined
            ? undefined
            : `${stockList.totalData} barang`
        }
        backHref={domainHref(MENU.INVENTORY)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={STOCK_CREATE_PATH}
              label="Tambah barang persediaan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari barang persediaan"
        searchPlaceholder="Cari nama atau kode"
        filters={[
          {
            key: "stok",
            label: "Stok",
            kind: "choice",
            options: STOCK_FILTER_OPTIONS,
          },
          {
            key: "tipe",
            label: "Tipe",
            kind: "select",
            options: [allOf("Semua tipe"), ...types.options],
          },
          {
            key: "ruang",
            label: "Ruang",
            kind: "select",
            options: [allOf("Semua ruang"), ...rooms.options],
          },
          {
            key: "satuan",
            label: "Satuan",
            kind: "select",
            options: [allOf("Semua satuan"), ...units.options],
          },
          {
            key: "bapel",
            label: "Badan pelayanan",
            kind: "select",
            options: [allOf("Semua badan pelayanan"), ...bapel.options],
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={stockList.items}
        getKey={(item) => item.code}
        label="Daftar barang persediaan"
        isLoading={stockList.isLoading}
        isRefreshing={stockList.isRefreshing}
        error={stockList.error}
        onRetry={stockList.onRetry}
        emptyTitle={
          isNarrowed
            ? "Tidak ada barang persediaan"
            : "Belum ada barang persediaan"
        }
        emptyDescription={
          isNarrowed
            ? "Tidak ada barang persediaan yang cocok dengan filter ini."
            : "Catat barang habis pakai seperti lilin, roti perjamuan, atau kertas."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={stockList.pagination}
        table={persediaanTable(isCanUpdate)}
        itemNoun="barang persediaan"
      >
        {(item) => <StockListItemRow item={item} isCanUpdate={isCanUpdate} />}
      </DataList>
    </div>
  );
};
