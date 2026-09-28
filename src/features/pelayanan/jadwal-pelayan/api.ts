"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ddlKeys } from "@/hooks/use-ddl-options";
import type { ListState } from "@/hooks/use-list-params";
import { useListQuery } from "@/hooks/use-list-query";
import { fetchList, fetchOne } from "@/lib/api/fetcher";

import type {
  JadwalPelayan,
  JadwalPelayanDetail,
  JadwalPelayanPayload,
  JadwalPelayanSaved,
  PelayanOption,
  TemplateOption,
} from "./types";

export const jadwalPelayanKeys = {
  all: ["jadwal-pelayan"] as const,
  lists: () => [...jadwalPelayanKeys.all, "list"] as const,
  detail: (code: string) => [...jadwalPelayanKeys.all, "detail", code] as const,
};

export function useJadwalPelayanList(params: ListState) {
  return useListQuery({
    queryKey: jadwalPelayanKeys.lists(),
    fetchPage: (apiQuery) =>
      fetchList<JadwalPelayan>(`/jadwal-pelayan?${apiQuery}`),
    params,
  });
}

export function useJadwalPelayanDetail(code: string | undefined) {
  return useQuery({
    queryKey: jadwalPelayanKeys.detail(code ?? ""),
    queryFn: () =>
      fetchOne<JadwalPelayanDetail>(
        `/jadwal-pelayan/${encodeURIComponent(code ?? "")}`,
      ),
    enabled: Boolean(code),
    staleTime: 0,
    select: (response) => response.data,
  });
}

function useInvalidateJadwal() {
  const queryClient = useQueryClient();

  return (isTemplateMade: boolean) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: jadwalPelayanKeys.all }),
      queryClient.invalidateQueries({ queryKey: ddlKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["ibadah"] }),
      isTemplateMade
        ? queryClient.invalidateQueries({
            queryKey: ["template-jadwal", "list"],
          })
        : null,
    ]);
}

export function useSaveJadwalPelayan(code?: string) {
  const onInvalidate = useInvalidateJadwal();

  return useMutation({
    mutationFn: (payload: JadwalPelayanPayload) =>
      fetchOne<JadwalPelayanSaved>(
        code
          ? `/jadwal-pelayan/${encodeURIComponent(code)}`
          : "/jadwal-pelayan",
        { method: code ? "PUT" : "POST", body: JSON.stringify(payload) },
      ),
    onSuccess: (_, payload) => onInvalidate(payload.makeTemplate),
  });
}

export function useDeleteJadwalPelayan(code: string | undefined) {
  const onInvalidate = useInvalidateJadwal();

  return useMutation({
    mutationFn: () =>
      fetchOne<JadwalPelayanSaved>(
        `/jadwal-pelayan/${encodeURIComponent(code ?? "")}`,
        { method: "DELETE" },
      ),
    onSuccess: () => onInvalidate(false),
  });
}

export function useTemplateOptions(bapelId: string) {
  const path = `template-jadwal?bapelId=${bapelId}`;

  return useQuery({
    queryKey: ddlKeys.list(path),
    queryFn: () => fetchList<TemplateOption>(`/ddl/${path}`),
    enabled: Boolean(bapelId),
    staleTime: 10 * 60_000,
    select: (response) => response.data,
  });
}

export type PelayanScope = {
  bapelId: string;
  date: string;
  startTime: string;
  endTime: string;
  excludeCode?: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isScopeReady = (scope: PelayanScope) =>
  Boolean(
    scope.bapelId &&
    ISO_DATE.test(scope.date) &&
    scope.startTime &&
    scope.endTime,
  );

export const pelayanPath = (scope: PelayanScope, roleId: string) => {
  const query = new URLSearchParams({
    roleId,
    bapelId: scope.bapelId,
    date: scope.date,
    startTime: scope.startTime,
    endTime: scope.endTime,
  });

  if (scope.excludeCode) query.set("excludeCode", scope.excludeCode);

  return `pelayan?${query.toString()}`;
};

export type PelayanRows = {
  rows: PelayanOption[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

export function usePelayanRows(
  scope: PelayanScope,
  roleIds: readonly string[],
) {
  const isReady = isScopeReady(scope);
  const roles = [...new Set(roleIds.filter(Boolean))];

  const results = useQueries({
    queries: roles.map((roleId) => {
      const path = pelayanPath(scope, roleId);

      return {
        queryKey: ddlKeys.list(path),
        queryFn: () => fetchList<PelayanOption>(`/ddl/${path}`),
        enabled: isReady,
      };
    }),
  });

  const byRole = new Map<string, PelayanRows>(
    roles.map((roleId, index) => [
      roleId,
      {
        rows: results[index]?.data?.data,
        isLoading: results[index]?.isFetching ?? false,
        isError: results[index]?.isError ?? false,
      },
    ]),
  );

  return { isReady, byRole };
}
