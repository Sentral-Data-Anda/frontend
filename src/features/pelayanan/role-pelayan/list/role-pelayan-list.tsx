"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useRolePelayanList } from "../api";

import { RolePelayanListItemRow, rolePelayanTable } from "./list-item";

export const RolePelayanList = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.ROLE_PELAYAN);
  const listParams = useListParams();
  const rolePelayanList = useRolePelayanList(listParams);
  const isSearched = Boolean(listParams.search);

  return (
    <div className="pb-6">
      <PageHeader
        title="Role Pelayan"
        subtitle={
          rolePelayanList.totalData === undefined
            ? undefined
            : `${rolePelayanList.totalData} tugas`
        }
        backHref={domainHref(MENU.PELAYANAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.PELAYANAN, MENU.ROLE_PELAYAN)}
              label="Tambah role pelayan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari role pelayan"
        searchPlaceholder="Cari nama tugas"
      />

      <DataList
        items={rolePelayanList.items}
        getKey={(rolePelayan) => String(rolePelayan.id)}
        label="Daftar role pelayan"
        isLoading={rolePelayanList.isLoading}
        isRefreshing={rolePelayanList.isRefreshing}
        error={rolePelayanList.error}
        onRetry={rolePelayanList.onRetry}
        emptyTitle={
          isSearched ? "Tidak ada role pelayan" : "Belum ada role pelayan"
        }
        emptyDescription={
          isSearched
            ? "Tidak ada role pelayan yang cocok dengan pencarian ini."
            : "Tambahkan jenis tugas dalam ibadah, mis. Liturgis, Pemusik, Multimedia, Penerima Tamu."
        }
        pagination={rolePelayanList.pagination}
        table={rolePelayanTable(isCanUpdate)}
        itemNoun="role pelayan"
      >
        {(rolePelayan) => (
          <RolePelayanListItemRow
            rolePelayan={rolePelayan}
            isCanUpdate={isCanUpdate}
          />
        )}
      </DataList>
    </div>
  );
};
