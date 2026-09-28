"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { Album, AlbumSaved } from "./types";

export const galeriKeys = {
  all: ["galeri"] as const,
  lists: () => [...galeriKeys.all, "list"] as const,
  detail: (code: string) => [...galeriKeys.all, "detail", code] as const,
};

// URL foto bertanda tangan 15 menit; dimuat ulang sebelum kedaluwarsa.
const URL_REFRESH_MS = 10 * 60_000;

const albumPath = (code: string) => `/gallery/${encodeURIComponent(code)}`;

export function useGaleriList(params: ListState) {
  return useListQuery({
    queryKey: galeriKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Album>(`/gallery?${apiQuery}`),
    params,
  });
}

export function useGaleriDetail(code: string | undefined) {
  return useQuery({
    queryKey: galeriKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Album>(albumPath(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    refetchInterval: URL_REFRESH_MS,
    select: (response) => response.data,
  });
}

function useInvalidateGaleri(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: galeriKeys.lists() }),
      code
        ? queryClient.invalidateQueries({
            queryKey: galeriKeys.detail(code),
            refetchType: "none",
          })
        : null,
    ]);
}

export function useSaveGaleri(code?: string) {
  const onInvalidate = useInvalidateGaleri(code);

  return useMutation({
    mutationFn: (body: FormData) =>
      fetchOne<AlbumSaved>(code ? albumPath(code) : "/gallery", {
        method: code ? "PUT" : "POST",
        body,
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteGaleri(code: string | undefined) {
  const onInvalidate = useInvalidateGaleri(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<AlbumSaved>(albumPath(code ?? ""), { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}
