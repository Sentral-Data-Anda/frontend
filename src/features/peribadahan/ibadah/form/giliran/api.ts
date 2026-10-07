"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { fetchList, fetchOne } from "@/lib/api/fetcher";
import type { ApiListResponse } from "@/types/api";

import { ibadahKeys } from "../../api";
import type { Ibadah, IbadahPayload } from "../../types";

export const rangeQuery = (
  typeId: string,
  zoneId: string,
  startDate: string,
  endDate: string,
) => ({
  queryKey: [...ibadahKeys.all, "range", typeId, zoneId, startDate, endDate],
  queryFn: () =>
    fetchList<Ibadah>(
      `/ibadah?typeIbadahId=${typeId}&zoneChurchId=${zoneId}&startDate=${startDate}&endDate=${endDate}&limit=100`,
    ),
});

export const toDateSet = (response: ApiListResponse<Ibadah>) =>
  new Set(response.data.map((ibadah) => ibadah.date.slice(0, 10)));

export function useLatestIbadah(typeId: string, zoneId: string) {
  return useQuery({
    queryKey: [...ibadahKeys.all, "latest", typeId, zoneId],
    queryFn: () =>
      fetchList<Ibadah>(
        `/ibadah?typeIbadahId=${typeId}&zoneChurchId=${zoneId}&limit=1`,
      ),
    enabled: Boolean(typeId && zoneId),
    staleTime: 0,
    select: (response) => response.data[0] ?? null,
  });
}

export function useIbadahInRange(
  typeId: string,
  zoneId: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    ...rangeQuery(typeId, zoneId, startDate, endDate),
    enabled: Boolean(typeId && zoneId && startDate && endDate),
    placeholderData: keepPreviousData,
    select: toDateSet,
  });
}

export function useSaveBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: IbadahPayload[]) =>
      fetchOne<{ codes: string[] }>("/ibadah/batch", {
        method: "POST",
        body: JSON.stringify({ rows }),
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ibadahKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ibadahKeys.hosts() }),
      ]),
  });
}
