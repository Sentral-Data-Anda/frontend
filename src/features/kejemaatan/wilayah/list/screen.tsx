"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useWilayahList } from "../api";
import { WILAYAH_STATUS_OPTIONS } from "../types";

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
        listParams={listParams}
        searchLabel="Cari wilayah"
        searchPlaceholder="Cari nama atau kode wilayah"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: WILAYAH_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={wilayahList.items}
        getKey={(wilayah) => wilayah.code}
        label="Daftar wilayah"
        isLoading={wilayahList.isLoading}
        isRefreshing={wilayahList.isRefreshing}
        error={wilayahList.error}
        onRetry={wilayahList.onRetry}
        emptyTitle="Tidak ada wilayah"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada wilayah yang cocok dengan pencarian atau filter ini."
            : "Data wilayah akan muncul di sini setelah ditambahkan."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
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
