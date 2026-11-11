import { DETAIL_LINK } from "@/components/common/display";
import { AppLink } from "@/components/common/link";
import {
  CsvDownloadButton,
  DataList,
  ListToolbar,
} from "@/components/common/list";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useListParams } from "@/hooks/use-list-params";

import {
  useActivityLogExport,
  useActivityLogList,
  useUserFilterOptions,
} from "../api";
import {
  ACTIVITY_LOG_LIST_PATH,
  LIST_FILTERS,
  listLogFilters,
  REQUEST_FILTER_KEY,
} from "../model";

import { ActivityLogListItemRow, activityLogTable } from "./list-item";

export const ActivityLogListScreen = () => {
  const listParams = useListParams({ filters: LIST_FILTERS });
  const logList = useActivityLogList(listParams);
  const userOptions = useUserFilterOptions();
  const logExport = useActivityLogExport(listParams);
  const requestId = listParams.filters[REQUEST_FILTER_KEY];

  return (
    <div className="pb-6">
      <PageHeader
        title="Activity Log"
        subtitle={
          logList.totalData === undefined
            ? undefined
            : `${logList.totalData} catatan`
        }
        backHref={domainHref(MENU.SETTINGS)}
        action={
          <CsvDownloadButton
            label="Ekspor CSV"
            isPending={logExport.isPending}
            onDownload={logExport.onExport}
          />
        }
      />

      {requestId ? (
        <p className="px-gutter pb-3 text-body text-muted-foreground">
          Menampilkan catatan dari satu permintaan{" "}
          <span className="font-mono break-all">{requestId}</span>.{" "}
          <AppLink href={ACTIVITY_LOG_LIST_PATH} className={DETAIL_LINK}>
            Tampilkan semua
          </AppLink>
        </p>
      ) : null}

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
