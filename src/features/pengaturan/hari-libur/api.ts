"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { HOLIDAY_CALENDAR_KEY } from "@/hooks/use-holiday-calendar";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Holiday, HolidayPayload, HolidayRow } from "./types";

export const holidayKeys = {
  all: ["hari-libur"] as const,
  lists: () => [...holidayKeys.all, "list"] as const,
  detail: (id: string) => [...holidayKeys.all, "detail", id] as const,
};

export function useHolidayList(params: ListState) {
  return useListQuery({
    queryKey: holidayKeys.lists(),
    fetchPage: (apiQuery) => fetchList<HolidayRow>(`/hari-libur?${apiQuery}`),
    params,
  });
}

export function useHolidayDetail(id: string | undefined) {
  return useQuery({
    queryKey: holidayKeys.detail(id ?? ""),
    queryFn: () => fetchOne<Holiday>(`/hari-libur/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateHoliday() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: HOLIDAY_CALENDAR_KEY }),
    ]);
}

export function useSaveHoliday(id?: string) {
  const onInvalidate = useInvalidateHoliday();

  return useMutation({
    mutationFn: (payload: HolidayPayload) =>
      fetchOne<Holiday>(id ? `/hari-libur/${id}` : "/hari-libur", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteHoliday(id: string | undefined) {
  const onInvalidate = useInvalidateHoliday();

  return useMutation({
    mutationFn: () =>
      fetchOne<Holiday>(`/hari-libur/${id}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}
