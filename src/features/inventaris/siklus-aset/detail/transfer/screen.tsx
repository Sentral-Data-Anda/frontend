"use client";

import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { PageHeader } from "@/components/layout";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { formatDate, formatDateShort } from "@/lib/format";

import { useTransferDetail } from "../../api";
import { AssetLink } from "../../asset-link";
import { DetailFrame } from "../../detail-frame";
import { CYCLE_LIST_PATH, kindReturnHref } from "../../model";

interface PropTypes {
  code: string;
}

export const TransferDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView } = useMenuAccess(MENU.ASSET_TRANSACTION);
  const backHref = kindReturnHref(useListReturn(CYCLE_LIST_PATH), "pindah");
  const detail = useTransferDetail(isCanView ? code : undefined);
  const row = detail.data;

  return (
    <DetailFrame noun="pindah lokasi" backHref={backHref} query={detail}>
      {row ? (
        <div className="pb-8">
          <PageHeader
            title={row.asset.name}
            subtitle={`${row.code} · ${formatDateShort(row.transferDate)}`}
            backHref={backHref}
            isBackPersistent
          />

          <div className="px-gutter">
            <Panel label="Pindah lokasi">
              <DescriptionList className="px-gutter py-2">
                <DescriptionItem label="Barang">
                  <AssetLink asset={row.asset} />
                </DescriptionItem>
                <DescriptionItem label="Tanggal">
                  <span className="tabular-nums">
                    {formatDate(row.transferDate)}
                  </span>
                </DescriptionItem>
                <DescriptionItem label="Dari ruang">
                  {row.fromRoom.name}
                </DescriptionItem>
                <DescriptionItem label="Ke ruang">
                  {row.toRoom.name}
                </DescriptionItem>
                <DescriptionItem label="Dari badan pelayanan">
                  {row.fromBapel.name}
                </DescriptionItem>
                <DescriptionItem label="Ke badan pelayanan">
                  {row.toBapel.name}
                </DescriptionItem>
                <DescriptionItem label="Alasan" isStacked isWide>
                  {row.reason ?? <OptionalText empty="Tanpa alasan" />}
                </DescriptionItem>
              </DescriptionList>
            </Panel>
          </div>
        </div>
      ) : null}
    </DetailFrame>
  );
};
