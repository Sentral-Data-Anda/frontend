"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type { SkillMusik, SkillMusikPayload } from "./types";

export const skillMusikKeys = {
  all: ["skill-musik"] as const,
  lists: () => [...skillMusikKeys.all, "list"] as const,
  detail: (id: string) => [...skillMusikKeys.all, "detail", id] as const,
};

const DAFTAR_PELAYAN_LIST_KEY = ["daftar-pelayan", "list"] as const;
const JADWAL_PELAYAN_KEY = ["jadwal-pelayan"] as const;

export function useSkillMusikList(params: ListState) {
  return useListQuery({
    queryKey: skillMusikKeys.lists(),
    fetchPage: (apiQuery) => fetchList<SkillMusik>(`/musik-skill?${apiQuery}`),
    params: { ...params, status: "" },
  });
}

export function useSkillMusikDetail(id: string | undefined) {
  return useQuery({
    queryKey: skillMusikKeys.detail(id ?? ""),
    queryFn: () => fetchOne<SkillMusik>(`/musik-skill/${id}`),
    enabled: Boolean(id),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateSkillMusik(id: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: skillMusikKeys.lists() }),
      // Tanpa refetch: form yang masih terpasang akan membaca 404 sesudah hapus.
      queryClient.invalidateQueries({
        queryKey: skillMusikKeys.detail(id ?? ""),
        refetchType: "none",
      }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.all }),
      queryClient.invalidateQueries({ queryKey: DAFTAR_PELAYAN_LIST_KEY }),
      queryClient.invalidateQueries({ queryKey: JADWAL_PELAYAN_KEY }),
    ]);
}

export function useSaveSkillMusik(id?: string) {
  const onInvalidate = useInvalidateSkillMusik(id);

  return useMutation({
    mutationFn: (payload: SkillMusikPayload) =>
      fetchOne<SkillMusik>(id ? `/musik-skill/${id}` : "/musik-skill", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: onInvalidate,
  });
}

export function useDeleteSkillMusik(id: string | undefined) {
  const onInvalidate = useInvalidateSkillMusik(id);

  return useMutation({
    mutationFn: () =>
      fetchOne<unknown>(`/musik-skill/${id}`, { method: "DELETE" }),
    onSuccess: onInvalidate,
  });
}
