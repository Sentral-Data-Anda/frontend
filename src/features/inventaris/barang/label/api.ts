"use client";

import { useQuery } from "@tanstack/react-query";

import { FetchError, fetchList, fetchOne } from "@/lib/api/fetcher";

import { assetKeys } from "../api";
import type { Asset } from "../types";

import type { LabelAsset, LabelSource } from "./model";

type LabelResult = { items: LabelAsset[]; total: number; missing: string[] };

const pick = ({ code, name }: LabelAsset): LabelAsset => ({ code, name });

const fetchOrNull = (code: string) =>
  fetchOne<Asset>(`/asset/${encodeURIComponent(code)}`).then(
    (response) => pick(response.data),
    (error: unknown) => {
      if (error instanceof FetchError && error.status === 404) return null;
      throw error;
    },
  );

async function fetchLabels(source: LabelSource): Promise<LabelResult> {
  if (source.kind === "filter") {
    const response = await fetchList<Asset>(`/asset?${source.query}`);

    return {
      items: response.data.map(pick),
      total: response.totalData,
      missing: [],
    };
  }

  const found = await Promise.all(source.codes.map(fetchOrNull));
  const items = found.filter((asset): asset is LabelAsset => asset !== null);

  return {
    items,
    total: items.length,
    missing: source.codes.filter((_, index) => found[index] === null),
  };
}

export function useLabelAssets(source: LabelSource, isEnabled: boolean) {
  return useQuery({
    queryKey: [...assetKeys.all, "label", source],
    queryFn: () => fetchLabels(source),
    enabled: isEnabled,
  });
}
