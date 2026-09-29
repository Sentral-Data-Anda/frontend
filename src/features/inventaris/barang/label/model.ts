import { toApiQuery } from "@/hooks/use-list-params";

import { BARANG_LIST_PATH, barangDetailHref } from "../model";
import type { Asset } from "../types";

export const LABELS_PER_SHEET = 24;

export const LABEL_LIMIT = 100;

export const BARANG_LABEL_PATH = `${BARANG_LIST_PATH}/label`;

export type LabelAsset = Pick<Asset, "code" | "name">;

export type LabelSource =
  { kind: "code"; codes: string[] } | { kind: "filter"; query: string };

const FILTER_API: Record<string, string> = {
  kondisi: "condition",
  sumber: "acquisitionSource",
  tipe: "typeId",
  ruang: "roomId",
  bapel: "bapelId",
};

export function labelSourceOf(params: URLSearchParams): LabelSource {
  const kode = params.get("kode");

  if (kode !== null) {
    const codes = kode
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);

    return { kind: "code", codes: [...new Set(codes)].slice(0, LABEL_LIMIT) };
  }

  return {
    kind: "filter",
    query: toApiQuery({
      page: 1,
      limit: LABEL_LIMIT,
      search: params.get("search") ?? "",
      status: params.get("status") || "aktif",
      apiFilters: Object.fromEntries(
        Object.entries(FILTER_API).map(([key, api]) => [
          api,
          params.get(key) ?? "",
        ]),
      ),
    }),
  };
}

export const labelHrefOf = (values: Record<string, string>) => {
  const query = new URLSearchParams(
    Object.entries(values).filter(([, value]) => value),
  ).toString();

  return query ? `${BARANG_LABEL_PATH}?${query}` : BARANG_LABEL_PATH;
};

export const labelUrlOf = (siteUrl: string, code: string) =>
  new URL(barangDetailHref(code), siteUrl).toString();

export function sheetsOf<T>(items: readonly T[]): T[][] {
  return Array.from(
    { length: Math.ceil(items.length / LABELS_PER_SHEET) },
    (_, index) =>
      items.slice(index * LABELS_PER_SHEET, (index + 1) * LABELS_PER_SHEET),
  );
}

export const codePartsOf = (code: string) => code.split(/(?<=[_-])/);
