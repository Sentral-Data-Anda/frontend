"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader, PageHeaderAdd } from "@/components/layout";
import { MENU, createHref, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams } from "@/hooks/use-list-params";

import { useMarriageList } from "../api";
import { MARRIAGE_STATUS_OPTIONS } from "../types";

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
        listParams={listParams}
        searchLabel="Cari pernikahan"
        searchPlaceholder="Cari nama suami atau istri"
        filters={[
          {
            key: "status",
            label: "Status",
            kind: "choice",
            options: MARRIAGE_STATUS_OPTIONS,
          },
        ]}
      />

      <DataList
        loadingShape="trailing"
        items={marriageList.items}
        getKey={(marriage) => marriage.id}
        label="Daftar pernikahan"
        isLoading={marriageList.isLoading}
        isRefreshing={marriageList.isRefreshing}
        error={marriageList.error}
        onRetry={marriageList.onRetry}
        emptyTitle="Tidak ada pernikahan"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada pernikahan yang cocok dengan pencarian atau filter ini."
            : "Data pernikahan akan muncul di sini setelah dicatat."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
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
