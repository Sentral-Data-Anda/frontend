"use client";

import { SearchInput } from "@/components/common/control";
import { DataList, FilterChips, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useWilayahList } from "../api";
import { WILAYAH_STATUS_CHIPS } from "../types";

import { WilayahListItemRow, wilayahTable } from "./list-item";

export const WilayahListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.WILAYAH);
  const listParams = useListParams();
  const wilayahList = useWilayahList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Wilayah"
        subtitle={
          wilayahList.totalData === undefined
            ? undefined
            : `${wilayahList.totalData} wilayah`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.WILAYAH)}
              label="Tambah wilayah"
            />
          ) : null
        }
      />

      <ListToolbar
        search={
          <SearchInput
            value={listParams.search}
            onSearch={listParams.onSearch}
            label="Cari wilayah"
            placeholder="Cari nama atau kode wilayah"
          />
        }
        filters={
          <FilterChips
            options={WILAYAH_STATUS_CHIPS}
            value={listParams.status}
            onPick={listParams.onPickStatus}
            label="Filter status wilayah"
          />
        }
      />

      <DataList
        items={wilayahList.items}
        getKey={(wilayah) => wilayah.code}
        label="Daftar wilayah"
        isLoading={wilayahList.isLoading}
        isRefreshing={wilayahList.isRefreshing}
        error={wilayahList.error}
        onRetry={wilayahList.onRetry}
        emptyTitle="Tidak ada wilayah"
        emptyDescription={
          listParams.search || listParams.status
            ? "Tidak ada wilayah yang cocok dengan pencarian atau filter ini."
            : "Data wilayah akan muncul di sini setelah ditambahkan."
        }
        pagination={wilayahList.pagination}
        table={wilayahTable(isCanUpdate)}
        itemNoun="wilayah"
      >
        {(wilayah) => (
          <WilayahListItemRow wilayah={wilayah} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
