import type { ListFilter } from "@/components/common/list";
import { monthOptions } from "@/lib/date";

import { disposalTable } from "./disposal-item";
import { maintenanceTable } from "./maintenance-item";
import { transferTable } from "./transfer-item";

export const SEARCH = {
  searchLabel: "Cari catatan",
  searchPlaceholder: "Cari barang atau kode",
};

export const MONTH_FILTER: ListFilter = {
  key: "bulan",
  label: "Bulan",
  kind: "select",
  options: [{ value: "", label: "Semua bulan" }, ...monthOptions()],
};

export const EMPTY_FILTERED = {
  title: "Tidak ada catatan",
  description: "Tidak ada catatan yang cocok dengan filter ini.",
};

export const loadingTableOf = (jenis: string | undefined) =>
  jenis === "pindah"
    ? transferTable
    : jenis === "pelepasan"
      ? disposalTable
      : maintenanceTable(false);
