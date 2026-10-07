"use client";

import { DataList, ListToolbar } from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useListParams } from "@/hooks/use-list-params";

import { useActivityLogList, useUserFilterOptions } from "../api";
import { LIST_FILTERS, listLogFilters } from "../model";

import { ActivityLogListItemRow, activityLogTable } from "./list-item";

export const ActivityLogListScreen = () => {
  const listParams = useListParams({ filters: LIST_FILTERS });
  const logList = useActivityLogList(listParams);
  const userOptions = useUserFilterOptions();

  return (
    <div className="pb-6">
      <PageHeader
        title="Log Aktivitas"
        subtitle={
          logList.totalData === undefined
            ? undefined
            : `${logList.totalData} catatan`
        }
        backHref={domainHref(MENU.PENGATURAN)}
      />

      <ListToolbar
        listParams={listParams}
        searchLabel="Cari ID rekaman"
        searchPlaceholder="mis. 128"
        filters={listLogFilters(userOptions.options)}
      />

      <DataList
        loadingShape="trailing"
        items={logList.items}
        getKey={(log) => String(log.id)}
        label="Log aktivitas"
        isLoading={logList.isLoading}
        isRefreshing={logList.isRefreshing}
        error={logList.error}
        onRetry={logList.onRetry}
        emptyTitle="Tidak ada catatan aktivitas"
        emptyDescription={
          listParams.search || listParams.isFiltered
            ? "Tidak ada catatan yang cocok dengan pencarian atau filter ini."
            : "Setiap penambahan, perubahan, dan penghapusan data akan tercatat di sini."
        }
        onClearFilter={
          listParams.isFiltered ? listParams.onClearFilters : undefined
        }
        pagination={logList.pagination}
        table={activityLogTable}
        itemNoun="catatan"
      >
        {(log) => <ActivityLogListItemRow log={log} />}
      </DataList>
    </div>
  );
};
