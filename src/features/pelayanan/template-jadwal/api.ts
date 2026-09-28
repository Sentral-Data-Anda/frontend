"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys, useDdlOptions } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  TemplateJadwalDetail,
  TemplateJadwalListItem,
  TemplateJadwalPayload,
  TemplateJadwalSaved,
} from "./types";

export const templateJadwalKeys = {
  all: ["template-jadwal"] as const,
  lists: () => [...templateJadwalKeys.all, "list"] as const,
  detail: (code: string) =>
    [...templateJadwalKeys.all, "detail", code] as const,
};

export function useTemplateJadwalList(params: ListState) {
  return useListQuery({
    queryKey: templateJadwalKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<TemplateJadwalListItem>(`/template-pelayan?${apiQuery}`),
    params,
  });
}

export function useTemplateJadwalDetail(code: string | undefined) {
  return useQuery({
    queryKey: templateJadwalKeys.detail(code ?? ""),
    queryFn: () => fetchOne<TemplateJadwalDetail>(`/template-pelayan/${code}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export const useBapelOptions = () => useDdlOptions("bapel");

export const useRoleOptions = () => useDdlOptions("role-pelayan");

function useInvalidateTemplateJadwal(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: templateJadwalKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: templateJadwalKeys.detail(code ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.all }),
    ]);
}

export function useSaveTemplateJadwal(code?: string) {
  const onInvalidate = useInvalidateTemplateJadwal(code);

  return useMutation({
    mutationFn: (payload: TemplateJadwalPayload) =>
      fetchOne<TemplateJadwalSaved>(
        code ? `/template-pelayan/${code}` : "/template-pelayan",
        { method: code ? "PUT" : "POST", body: JSON.stringify(payload) },
      ),
    onSuccess: onInvalidate,
  });
}

export function useDeleteTemplateJadwal(code: string | undefined) {
  const onInvalidate = useInvalidateTemplateJadwal(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(`/template-pelayan/${code}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}
