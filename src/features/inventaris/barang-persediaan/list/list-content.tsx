"use client";

import { useState } from "react";

import { useToast } from "@/components/common/feedback";
import {
  DataList,
  ListToolbar,
  RowDeleteDialog,
} from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { useListParams } from "@/hooks/use-list-params";

import { useDeleteStock, useStockList } from "../api";
import {
  STOCK_CREATE_PATH,
  STOCK_FILTERS,
  STOCK_FILTER_OPTIONS,
} from "../model";
import type { StockItem } from "../types";

import {
  deleteTargetLabelOf,
  persediaanTable,
  StockListItemRow,
} from "./list-item";

const allOf = (label: string) => ({ value: "", label });

export const StockListContent = () => {
  const { isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
    MENU.STOCK_ITEM,
  );

  const toast = useToast();

  // Satu keadaan menyimpan baris yang akan dihapus sekaligus status terbuka
  // dialognya. Hook hapus dibuat ulang mengikuti kunci baris ini.
  const [target, setTarget] = useState<StockItem | null>(null);
  const deleteRow = useDeleteStock(target?.code);
  const listParams = useListParams({ filters: STOCK_FILTERS });
  const stockList = useStockList(listParams);
  const types = useDdlOptions("type-item", "id", listParams.filters.tipe);
  const rooms = useDdlOptions("room", "id", listParams.filters.ruang);
  const units = useDdlOptions("unit", "id", listParams.filters.satuan);
  const bapel = useDdlOptions("bapel", "id", listParams.filters.bapel);
  const isNarrowed = Boolean(listParams.search) || listParams.isFiltered;

  const onDelete = () => {
    deleteRow.mutate(undefined, {
      onSuccess: (deleted) => {
        toast.add({ title: deleted.message });
        setTarget(null);
      },
    });
  };

  const onCancelDelete = () => {
    deleteRow.reset();
    setTarget(null);
  };

  return (
    <div className="pb-6">
      <PageHeader
        title="Stock Item"
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
        table={persediaanTable(
          isCanUpdate,
          isCanDelete ? setTarget : undefined,
        )}
        itemNoun="barang persediaan"
      >
        {(item) => <StockListItemRow item={item} />}
      </DataList>

      <RowDeleteDialog
        target={target ? { label: deleteTargetLabelOf(target) } : null}
        entity="barang persediaan"
        isPending={deleteRow.isPending}
        errorMessage={deleteRow.error?.message}
        onCancel={onCancelDelete}
        onConfirm={onDelete}
      />
    </div>
  );
};
