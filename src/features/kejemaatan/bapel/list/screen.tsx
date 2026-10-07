"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useBapelList } from "../api";

import { BapelListItemRow, bapelTable } from "./list-item";

export const BapelListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.BAPEL);
  const listParams = useListParams();
  const bapelList = useBapelList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Badan Pelayanan"
        subtitle={
          bapelList.totalData === undefined
            ? undefined
            : `${bapelList.totalData} badan pelayanan`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.BAPEL)}
              label="Tambah badan pelayanan"
            />
          ) : null
        }
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari badan pelayanan"
        searchPlaceholder="Cari nama badan pelayanan"
      />

      <DataList
        loadingShape="trailing"
        items={bapelList.items}
        getKey={(bapel) => bapel.code}
        label="Daftar badan pelayanan"
        isLoading={bapelList.isLoading}
        isRefreshing={bapelList.isRefreshing}
        error={bapelList.error}
        onRetry={bapelList.onRetry}
        emptyTitle="Tidak ada badan pelayanan"
        emptyDescription={
          listParams.search
            ? "Tidak ada badan pelayanan yang cocok dengan pencarian ini."
            : "Data badan pelayanan akan muncul di sini setelah ditambahkan."
        }
        pagination={bapelList.pagination}
        table={bapelTable(isCanUpdate)}
        itemNoun="badan pelayanan"
      >
        {(bapel) => (
          <BapelListItemRow bapel={bapel} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
