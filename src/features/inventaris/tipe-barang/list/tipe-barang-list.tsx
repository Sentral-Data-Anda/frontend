"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useTipeBarangList } from "../api";

import { TipeBarangListItemRow, tipeBarangTable } from "./list-item";

export const TipeBarangList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.TIPE_BARANG);
  const listParams = useListParams();
  const tipeBarangList = useTipeBarangList(listParams);
  const isSearched = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Tipe Barang"
        subtitle={
          tipeBarangList.totalData === undefined
            ? undefined
            : `${tipeBarangList.totalData} tipe`
        }
        backHref={domainHref(MENU.INVENTARIS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.INVENTARIS, MENU.TIPE_BARANG)}
              label="Tambah tipe barang"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari tipe barang"
        searchPlaceholder="Cari nama tipe"
      />

      <DataList
        items={tipeBarangList.items}
        getKey={(tipeBarang) => tipeBarang.code}
        label="Daftar tipe barang"
        isLoading={tipeBarangList.isLoading}
        isRefreshing={tipeBarangList.isRefreshing}
        error={tipeBarangList.error}
        onRetry={tipeBarangList.onRetry}
        emptyTitle={
          isSearched ? "Tidak ada tipe barang" : "Belum ada tipe barang"
        }
        emptyDescription={
          isSearched
            ? "Tidak ada tipe barang yang cocok."
            : "Tambahkan kategori seperti Elektronik, Mebel, atau ATK."
        }
        pagination={tipeBarangList.pagination}
        table={tipeBarangTable(isCanUpdate)}
        itemNoun="tipe barang"
      >
        {(tipeBarang) => (
          <TipeBarangListItemRow
            tipeBarang={tipeBarang}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};
