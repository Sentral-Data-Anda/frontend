import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { MediaThumb } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { saveListFocus } from "@/lib/list-return";

import {
  BARANG_LIST_PATH,
  assetMetaOf,
  barangDetailHref,
  isActiveAsset,
} from "../model";
import type { Asset } from "../types";
import { AssetStatusBadge } from "../ui";

import { EditLink } from "./edit-link";

const saveFocus = (asset: Asset) => saveListFocus(BARANG_LIST_PATH, asset.code);

const detailHrefOf = (asset: Asset) => barangDetailHref(asset.code);

const viewLabelOf = (asset: Asset) => `Lihat barang ${asset.name}`;

const photoOf = (asset: Asset) => (
  <MediaThumb
    src={asset.mainImage?.url ?? null}
    alt={asset.mainImage?.name ?? asset.name}
  />
);

const textCell = (text: string) => (
  <span className="block truncate" title={text}>
    {text}
  </span>
);

interface PropTypes {
  asset: Asset;
  isCanUpdate?: boolean;
}

export const BarangListItemRow = (props: PropTypes) => {
  const { asset, isCanUpdate = false } = props;

  return (
    <DataListRow
      id={asset.code}
      className="hover:bg-card relative transition-colors"
      leading={photoOf(asset)}
      title={
        <Link
          href={detailHrefOf(asset)}
          onClick={() => saveFocus(asset)}
          aria-label={viewLabelOf(asset)}
          className={TABLE_ROW_LINK}
        >
          {asset.name}
        </Link>
      }
      meta={assetMetaOf(asset)}
      trailing={
        <>
          <AssetStatusBadge asset={asset} />
          {isCanUpdate && isActiveAsset(asset) ? (
            <EditLink asset={asset} />
          ) : null}
        </>
      }
    />
  );
};

type Column = DataTableColumn<Asset>;

const COLUMNS: Column[] = [
  {
    key: "asset",
    header: "Barang",
    width: "minmax(0,2.5fr)",
    cell: (asset) => (
      <span className="flex min-w-0 items-center gap-3">
        {photoOf(asset)}
        <span className="min-w-0">
          <span className="block truncate font-medium" title={asset.name}>
            {asset.name}
          </span>
          <span className="text-muted-foreground block truncate text-caption tabular-nums">
            {asset.code}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: "type",
    header: "Tipe",
    width: "minmax(0,1.2fr)",
    cell: (asset) => textCell(asset.type.name),
  },
  {
    key: "room",
    header: "Ruang",
    width: "minmax(0,1.5fr)",
    cell: (asset) => textCell(asset.room.name),
  },
  {
    key: "bapel",
    header: "Badan pelayanan",
    width: "minmax(0,1.5fr)",
    isSecondary: true,
    cell: (asset) => textCell(asset.bapel.name),
  },
  {
    key: "status",
    header: "Status",
    width: "minmax(0,1.2fr)",
    cell: (asset) => <AssetStatusBadge asset={asset} />,
  },
];

const EDIT_COLUMN: Column = {
  key: "edit",
  header: "",
  width: "2rem",
  align: "end",
  cell: (asset) => (isActiveAsset(asset) ? <EditLink asset={asset} /> : null),
};

export function barangTable(isCanUpdate: boolean): DataTableConfig<Asset> {
  return {
    columns: isCanUpdate ? [...COLUMNS, EDIT_COLUMN] : COLUMNS,
    getRowHref: detailHrefOf,
    getRowLabel: viewLabelOf,
    onRowOpen: saveFocus,
    rowIcon: <ChevronRight />,
  };
}
