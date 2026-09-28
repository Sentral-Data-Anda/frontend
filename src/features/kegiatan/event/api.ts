"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";
import { MEDIA_REFETCH_MS } from "@/lib/attachment";

import {
  toEventApiFilters,
  toEventFormData,
  type EventFormValues,
} from "./model";
import type { ChurchEvent, EventSaved } from "./types";

export const eventKeys = {
  all: ["event"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  detail: (code: string) => [...eventKeys.all, "detail", code] as const,
};

const pathOf = (code?: string) =>
  code ? `/event/${encodeURIComponent(code)}` : "/event";

export function useEventList(params: ListState) {
  return useListQuery({
    queryKey: eventKeys.lists(),
    fetchPage: (apiQuery) => fetchList<ChurchEvent>(`/event?${apiQuery}`),
    params: {
      ...params,
      status: "",
      apiFilters: toEventApiFilters(params.filters, params.status),
    },
    refetchInterval: MEDIA_REFETCH_MS,
  });
}

export function useEventDetail(code: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(code ?? ""),
    queryFn: () => fetchOne<ChurchEvent>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    refetchInterval: MEDIA_REFETCH_MS,
    select: (response) => response.data,
  });
}

function useInvalidateEvent(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() }),
      queryClient.invalidateQueries({
        queryKey: ddlKeys.all,
        predicate: (query) => String(query.queryKey[1]).startsWith("event"),
      }),
      code
        ? queryClient.invalidateQueries({
            queryKey: eventKeys.detail(code),
            refetchType: "none",
          })
        : null,
    ]);
}

export function useSaveEvent(code?: string) {
  const onInvalidate = useInvalidateEvent(code);

  return useMutation({
    mutationFn: (values: EventFormValues) =>
      fetchOne<EventSaved>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body: toEventFormData(values),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteEvent(code: string | undefined) {
  const onInvalidate = useInvalidateEvent(code);

  return useMutation({
    mutationFn: () => fetchOne<EventSaved>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}
