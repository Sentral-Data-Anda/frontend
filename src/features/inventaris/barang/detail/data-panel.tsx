import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatDate } from "@/lib/format";

import { CONDITION_LABEL, isWarrantyOver } from "../model";
import type { AssetDetail } from "../types";

interface PropTypes {
  asset: AssetDetail;
}

export const DataPanel = (props: PropTypes) => {
  const { asset } = props;

  return (
    <Panel label="Data barang" className="px-gutter py-4">
      <h2 className="mb-1 text-title font-semibold">Data barang</h2>
      <DescriptionList>
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{asset.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Tipe">{asset.type.name}</DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {asset.bapel.name}
        </DescriptionItem>
        <DescriptionItem label="Ruang">{asset.room.name}</DescriptionItem>
        <DescriptionItem label="Nomor seri">
          <OptionalText text={asset.serialNumber} empty="Tanpa nomor seri" />
        </DescriptionItem>
        <DescriptionItem label="Kondisi">
          {CONDITION_LABEL[asset.condition]}
        </DescriptionItem>
        <DescriptionItem label="Garansi sampai">
          {asset.warrantyUntil ? (
            isWarrantyOver(asset.warrantyUntil) ? (
              <span className="text-muted-foreground">
                {formatDate(asset.warrantyUntil)} · habis
              </span>
            ) : (
              formatDate(asset.warrantyUntil)
            )
          ) : (
            <OptionalText empty="Tanpa garansi" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Keterangan" isStacked isWide>
          <span className="font-normal">{asset.description}</span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
