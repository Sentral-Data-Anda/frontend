"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { SelectOption } from "@/components/common/control";
import { useDdlSearch } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import { mergeHostOptions, toIbadahApiFilters } from "./model";
import type {
  HostSuggestion,
  Ibadah,
  IbadahDetail,
  IbadahPayload,
  IbadahSaved,
  KeluargaAddress,
} from "./types";

export const ibadahKeys = {
  all: ["ibadah"] as const,
  lists: () => [...ibadahKeys.all, "list"] as const,
  detail: (code: string) => [...ibadahKeys.all, "detail", code] as const,
  hosts: () => [...ibadahKeys.all, "saran"] as const,
};

export function useIbadahList(params: ListState) {
  return useListQuery({
    queryKey: ibadahKeys.lists(),
    fetchPage: (apiQuery) => fetchList<Ibadah>(`/ibadah?${apiQuery}`),
    params: { ...params, apiFilters: toIbadahApiFilters(params.filters) },
  });
}

export function useIbadahDetail(code: string | undefined) {
  return useQuery({
    queryKey: ibadahKeys.detail(code ?? ""),
    queryFn: () =>
      fetchOne<IbadahDetail>(`/ibadah/${encodeURIComponent(code ?? "")}`),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateIbadah(code: string | undefined) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ibadahKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: ibadahKeys.hosts() }),
      code
        ? queryClient.invalidateQueries({
            queryKey: ibadahKeys.detail(code),
            refetchType: "none",
          })
        : null,
    ]);
}

export function useSaveIbadah(code?: string) {
  const onInvalidate = useInvalidateIbadah(code);

  return useMutation({
    mutationFn: (payload: IbadahPayload) =>
      fetchOne<IbadahSaved>(
        code ? `/ibadah/${encodeURIComponent(code)}` : "/ibadah",
        { method: code ? "PUT" : "POST", body: JSON.stringify(payload) },
      ),
    onSuccess: onInvalidate,
  });
}

export function useDeleteIbadah(code: string | undefined) {
  const onInvalidate = useInvalidateIbadah(code);

  return useMutation({
    mutationFn: () =>
      fetchOne<IbadahSaved>(`/ibadah/${encodeURIComponent(code ?? "")}`, {
        method: "DELETE",
      }),
    onSuccess: onInvalidate,
  });
}

export const keluargaAddressQuery = (id: string) => ({
  queryKey: ["ddl", "keluarga-alamat", id] as const,
  queryFn: () =>
    fetchOne<KeluargaAddress>(
      `/ddl/keluarga/${encodeURIComponent(id)}/alamat`,
    ).then((response) => response.data),
  staleTime: 0,
  retry: false,
});

export function useKeluargaAddress(id: string, isEnabled: boolean) {
  return useQuery({ ...keluargaAddressQuery(id), enabled: isEnabled });
}

type HostParams = {
  isEnabled: boolean;
  typeIbadahId: string;
  zoneChurchId: string;
  pinned: SelectOption | null;
};

export function useHostOptions(params: HostParams) {
  const { isEnabled, typeIbadahId, zoneChurchId, pinned } = params;

  const [term, setTerm] = useState("");
  const keluarga = useDdlSearch("keluarga", "id", pinned);
  const suggestions = useQuery({
    queryKey: [...ibadahKeys.hosts(), typeIbadahId, zoneChurchId],
    queryFn: () =>
      fetchList<HostSuggestion>(
        `/ibadah/saran-tuan-rumah?typeIbadahId=${typeIbadahId}&zoneChurchId=${zoneChurchId}`,
      ),
    enabled: isEnabled && Boolean(typeIbadahId && zoneChurchId),
    select: (response) => response.data,
  });

  const onSearch = (query: string) => {
    setTerm(query);
    keluarga.onSearch(query);
  };

  return {
    options: mergeHostOptions(suggestions.data ?? [], keluarga.options, term),
    isLoading: keluarga.isLoading || suggestions.isFetching,
    onSearch,
  };
}
