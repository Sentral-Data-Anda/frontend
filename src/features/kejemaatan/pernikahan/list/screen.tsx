"use client";

import { SearchInput } from "@/components/common/control";
import { DataList, FilterChips, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useMarriageList } from "../api";
import { MARRIAGE_STATUS_CHIPS } from "../types";

import { MarriageListItemRow, marriageTable } from "./list-item";

export const MarriageListScreen = () => {
  const { isCanCreate, isCanUpdate } = useMenuAccess(MENU.PERNIKAHAN);
  const listParams = useListParams();
  const marriageList = useMarriageList(listParams);

  return (
    <div className="pb-6">
      <PageHeader
        title="Pernikahan"
        subtitle={
          marriageList.totalData === undefined
            ? undefined
            : `${marriageList.totalData} pernikahan`
        }
        backHref={domainHref(MENU.KEJEMAATAN)}
        action={
          isCanCreate ? (
            <PageHeaderAdd
              href={createHref(MENU.KEJEMAATAN, MENU.PERNIKAHAN)}
              label="Catat pernikahan"
            />
          ) : null
        }
      />

      <ListToolbar
        search={
          <SearchInput
            value={listParams.search}
            onSearch={listParams.onSearch}
            label="Cari pernikahan"
            placeholder="Cari nama suami atau istri"
          />
        }
        filters={
          <FilterChips
            options={MARRIAGE_STATUS_CHIPS}
            value={listParams.status}
            onPick={listParams.onPickStatus}
            label="Filter status pernikahan"
          />
        }
      />

      <DataList
        items={marriageList.items}
        getKey={(marriage) => marriage.id}
        label="Daftar pernikahan"
        isLoading={marriageList.isLoading}
        isRefreshing={marriageList.isRefreshing}
        error={marriageList.error}
        onRetry={marriageList.onRetry}
        emptyTitle="Tidak ada pernikahan"
        emptyDescription={
          listParams.search || listParams.status
            ? "Tidak ada pernikahan yang cocok dengan pencarian atau filter ini."
            : "Data pernikahan akan muncul di sini setelah dicatat."
        }
        pagination={marriageList.pagination}
        table={marriageTable(isCanUpdate)}
        itemNoun="pernikahan"
      >
        {(marriage) => (
          <MarriageListItemRow marriage={marriage} isCanUpdate={isCanUpdate} />
        )}
      </DataList>
    </div>
  );
};
