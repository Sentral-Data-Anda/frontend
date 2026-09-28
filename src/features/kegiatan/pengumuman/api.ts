"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Announcement, AnnouncementSaved } from "./types";

export const pengumumanKeys = {
  all: ["pengumuman"] as const,
  lists: () => [...pengumumanKeys.all, "list"] as const,
  detail: (code: string) => [...pengumumanKeys.all, "detail", code] as const,
};

const pathOf = (code?: string) =>
  code ? `/pengumuman/${encodeURIComponent(code)}` : "/pengumuman";

export function usePengumumanList(params: ListState) {
  return useListQuery({
    queryKey: pengumumanKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Announcement>(`/pengumuman?${apiQuery}`),
    params,
  });
}

export function usePengumumanDetail(code: string | undefined) {
  return useQuery({
    queryKey: pengumumanKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Announcement>(pathOf(code)),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidatePengumuman() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: pengumumanKeys.all });
}

export function useSavePengumuman(code?: string) {
  const onInvalidate = useInvalidatePengumuman();

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<AnnouncementSaved>(pathOf(code), {
        method: code ? "PUT" : "POST",
        body,
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeletePengumuman(code: string | undefined) {
  const onInvalidate = useInvalidatePengumuman();

  return useMutation({
    mutationFn: () =>
      fetchOne<AnnouncementSaved>(pathOf(code), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}
