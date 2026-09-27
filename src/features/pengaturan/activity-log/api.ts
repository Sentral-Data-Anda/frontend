"use client";

import { useQuery } from "@tanstack/react-query";

import { useDdlOptions } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { todayJakarta } from "@/lib/date";

import { actionKindOf, SUPPORTED_FILTERS, toLogApiFilters } from "./model";
import type { ActivityLog, ActivityLogListItem } from "./types";

export const activityLogKeys = {
  all: ["activity-log"] as const,
  lists: () => [...activityLogKeys.all, "list"] as const,
  detail: (id: string) => [...activityLogKeys.all, "detail", id] as const,
};

const toListItem = ({
  oldData,
  newData,
  ...log
}: ActivityLog): ActivityLogListItem => ({
  ...log,
  kind: actionKindOf({ action: log.action, oldData, newData }),
});

const fetchPage = async (apiQuery: string) => {
  const response = await fetchList<ActivityLog>(`/activity-log?${apiQuery}`);

  return { ...response, data: response.data.map(toListItem) };
};

export function useActivityLogList(params: ListState) {
  return useListQuery({
    queryKey: activityLogKeys.lists(),
    fetchPage,
    params: {
      ...params,
      apiFilters: toLogApiFilters(params.filters, todayJakarta()),
    },
  });
}

export function useActivityLogDetail(id: string) {
  return useQuery({
    queryKey: activityLogKeys.detail(id),
    queryFn: () =>
      fetchOne<ActivityLog>(`/activity-log/${encodeURIComponent(id)}`),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export const useUserFilterOptions = () =>
  useDdlOptions(SUPPORTED_FILTERS.includes("pengguna") ? "user" : null, "code");
