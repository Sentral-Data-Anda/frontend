"use client";

import { SearchInput } from "@/components/common/control";
import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useKeluargaList } from "../api";

import { KeluargaListItemRow, keluargaTable } from "./list-item";

export const KeluargaListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.KELUARGA);
  const listParams = useListParams();
  const keluargaList = useKeluargaList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Keluarga"
        subtitle={
          keluargaList.totalData === undefined
            ? undefined
            : `${keluargaList.totalData} keluarga`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.KELUARGA)}
              label="Tambah keluarga"
            />
          ) : null
        }
      />

      <ListToolbar
        search={
          <SearchInput
            value={listParams.search}
            onSearch={listParams.onSearch}
            label="Cari keluarga"
            placeholder="Cari nama atau kode keluarga"
          />
        }
      />

      <DataList
        items={keluargaList.items}
        getKey={(keluarga) => keluarga.code}
        label="Daftar keluarga"
        isLoading={keluargaList.isLoading}
        isRefreshing={keluargaList.isRefreshing}
        error={keluargaList.error}
        onRetry={keluargaList.onRetry}
        emptyTitle="Tidak ada keluarga"
        emptyDescription={
          listParams.search
            ? "Tidak ada keluarga yang cocok dengan pencarian ini."
            : "Data keluarga akan muncul di sini setelah ditambahkan."
        }
        pagination={keluargaList.pagination}
        table={keluargaTable(isCanUpdate)}
        itemNoun="keluarga"
      >
        {(keluarga) => (
          <KeluargaListItemRow keluarga={keluarga} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
