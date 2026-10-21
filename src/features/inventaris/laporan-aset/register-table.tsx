import type { DataTableConfig } from "@/components/common/list";
import { formatDate } from "@/lib/format";

import { money } from "./model";
import type { AssetRegisterRow } from "./types";

export const registerTable = (): DataTableConfig<AssetRegisterRow> => ({
  columns: [
    {
      key: "code",
      header: "Kode",
      width: "minmax(0,2fr)",
      cell: (row) => (
        <span className="block truncate tabular-nums">{row.code}</span>
      ),
    },
    {
      key: "name",
      header: "Nama",
      width: "minmax(0,2fr)",
      cell: (row) => (
        <span className="block truncate" title={row.name}>
          {row.name}
        </span>
      ),
    },
    {
      key: "type",
      header: "Tipe",
      width: "minmax(0,1.1fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate">
          {row.type.name}
        </span>
      ),
    },
    {
      key: "acquisitionDate",
      header: "Perolehan",
      width: "minmax(0,1.2fr)",
      isSecondary: true,
      cell: (row) => (
        <span className="text-muted-foreground block truncate tabular-nums">
          {row.acquisitionDate ? formatDate(row.acquisitionDate) : "—"}
        </span>
      ),
    },
    {
      key: "acquisitionCost",
      header: "Harga perolehan",
      width: "minmax(0,1.6fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {money(row.acquisitionCost)}
        </span>
      ),
    },
    {
      key: "accumulated",
      header: "Akumulasi",
      width: "minmax(0,1.6fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate tabular-nums">
          {money(row.accumulated)}
        </span>
      ),
    },
    {
      key: "bookValue",
      header: "Nilai buku",
      width: "minmax(0,1.6fr)",
      align: "end",
      cell: (row) => (
        <span className="block truncate font-medium tabular-nums">
          {money(row.bookValue)}
        </span>
      ),
    },
  ],
});
