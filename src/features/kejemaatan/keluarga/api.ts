"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SelectOption } from "@/components/common/control";
import { useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  EndMembershipPayload,
  Keluarga,
  KeluargaMember,
  KeluargaMemberPayload,
  KeluargaPayload,
} from "./types";

export const keluargaKeys = {
  all: ["keluarga"] as const,
  lists: () => [...keluargaKeys.all, "list"] as const,
  detail: (code: string) => [...keluargaKeys.all, "detail", code] as const,
  members: (code: string) => [...keluargaKeys.all, "members", code] as const,
};

/** Search jemaat by name or code, to pick the people in a household. */
export const useJemaatOptions = (pinned: SelectOption | null = null) =>
  useDdlSearch("jemaat", "code", pinned);

/** Households a child can be moved into when a couple breaks up. */
export const useKeluargaOptions = (pinned: SelectOption | null = null) =>
  useDdlSearch("keluarga", "code", pinned);

const pathOf = (key: string) => `/keluarga/${encodeURIComponent(key)}`;

export function useKeluargaList(params: ListState) {
  return useListQuery({
    queryKey: keluargaKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Keluarga>(`/keluarga?${apiQuery}`),
    params,
  });
}

export function useKeluargaDetail(code: string | undefined) {
  return useQuery({
    queryKey: keluargaKeys.detail(code ?? ""),
    queryFn: () => fetchOne<Keluarga>(pathOf(code ?? "")),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useKeluargaMembers(code: string | undefined) {
  return useQuery({
    queryKey: keluargaKeys.members(code ?? ""),
    queryFn: () => fetchList<KeluargaMember>(`${pathOf(code ?? "")}/member`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

export function useSaveKeluarga(code?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: KeluargaPayload) =>
      fetchOne<Keluarga>(code ? pathOf(code) : "/keluarga", {
        method: code ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keluargaKeys.lists() }),
  });
}

export function useAddKeluargaMember(code: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: KeluargaMemberPayload) =>
      fetchOne<KeluargaMember>(`${pathOf(code ?? "")}/member`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: keluargaKeys.members(code ?? ""),
      }),
  });
}

export function useEndKeluargaMember(code: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      memberId: string;
      payload: EndMembershipPayload;
    }) =>
      fetchOne<KeluargaMember>(
        `${pathOf(code ?? "")}/member/${encodeURIComponent(variables.memberId)}/end`,
        { method: "PUT", body: JSON.stringify(variables.payload) },
      ),
    // The household's name can change with this call — the head may have been
    // handed over — so the list and detail are refetched, not only the members.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: keluargaKeys.members(code ?? ""),
        }),
        queryClient.invalidateQueries({ queryKey: keluargaKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: keluargaKeys.detail(code ?? ""),
        }),
      ]),
  });
}

export function useDeleteKeluarga(code: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchOne<Keluarga>(pathOf(code ?? ""), { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keluargaKeys.lists() }),
  });
}
