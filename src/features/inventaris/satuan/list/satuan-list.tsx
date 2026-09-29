"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useSatuanList } from "../api";

import { SatuanListItemRow, satuanTable } from "./list-item";

export const SatuanList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.SATUAN);
  const listParams = useListParams();
  const satuanList = useSatuanList(listParams);
  const isSearched = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Satuan"
        subtitle={
          satuanList.totalData === undefined
            ? undefined
            : `${satuanList.totalData} satuan`
        }
        backHref={domainHref(MENU.INVENTARIS)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.INVENTARIS, MENU.SATUAN)}
              label="Tambah satuan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari satuan"
        searchPlaceholder="Cari nama satuan"
      />

      <DataList
        items={satuanList.items}
        getKey={(satuan) => satuan.code}
        label="Daftar satuan"
        isLoading={satuanList.isLoading}
        isRefreshing={satuanList.isRefreshing}
        error={satuanList.error}
        onRetry={satuanList.onRetry}
        emptyTitle={isSearched ? "Tidak ada satuan" : "Belum ada satuan"}
        emptyDescription={
          isSearched
            ? "Tidak ada satuan yang cocok."
            : "Tambahkan satuan hitung seperti Buah, Pak, atau Rim."
        }
        pagination={satuanList.pagination}
        table={satuanTable(isCanUpdate)}
        itemNoun="satuan"
      >
        {(satuan) => (
          <SatuanListItemRow satuan={satuan} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
