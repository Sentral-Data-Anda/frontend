import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatAmount, formatDate } from "@/lib/format";

import {
  SOURCE_LABEL,
  costLabelOf,
  formatMonth,
  formatPeriod,
  usefulLifeOf,
} from "../model";
import type { AssetDetail } from "../types";

const rupiahOf = (value: string | null, empty: string) =>
  value === null ? (
    <OptionalText empty={empty} />
  ) : (
    <span className="tabular-nums">{formatAmount(value)}</span>
  );

interface PropTypes {
  asset: AssetDetail;
}

export const ValuePanel = (props: PropTypes) => {
  const { asset } = props;

  const { depreciation } = asset;
  const source = SOURCE_LABEL[asset.acquisitionSource];

  return (
    <Panel label="Perolehan dan penyusutan" className="px-gutter py-4">
      <h2 className="mb-1 text-title font-semibold">Perolehan & penyusutan</h2>
      <DescriptionList>
        <DescriptionItem label="Sumber">
          {asset.donorName ? `${source} dari ${asset.donorName}` : source}
        </DescriptionItem>
        <DescriptionItem label="Tanggal perolehan">
          {asset.acquisitionDate ? (
            formatDate(asset.acquisitionDate)
          ) : (
            <OptionalText empty="Tanggal belum dicatat" />
          )}
        </DescriptionItem>
        <DescriptionItem label={costLabelOf(asset.acquisitionSource)}>
          {rupiahOf(asset.acquisitionCost, "Nilai belum dicatat")}
        </DescriptionItem>

        {depreciation ? (
          <>
            <DescriptionItem label="Masa manfaat">
              {asset.usefulLifeMonths
                ? usefulLifeOf(asset.usefulLifeMonths)
                : null}
            </DescriptionItem>
            <DescriptionItem label="Nilai residu">
              {rupiahOf(asset.salvageValue, "Tanpa nilai residu")}
            </DescriptionItem>
            <DescriptionItem label="Mulai disusutkan">
              {asset.depreciationStartDate
                ? formatMonth(asset.depreciationStartDate)
                : null}
            </DescriptionItem>
            {asset.openingAccumulatedDepreciation &&
            asset.openingAccumulatedAsOf ? (
              <DescriptionItem label="Akumulasi awal">
                <span className="tabular-nums">
                  {formatAmount(asset.openingAccumulatedDepreciation)} per{" "}
                  {formatMonth(asset.openingAccumulatedAsOf)}
                </span>
              </DescriptionItem>
            ) : null}
            <DescriptionItem label="Akumulasi penyusutan">
              {rupiahOf(depreciation.accumulated, "Belum ada")}
            </DescriptionItem>
            <DescriptionItem label="Nilai buku">
              <span className="text-title font-semibold tabular-nums">
                {formatAmount(depreciation.bookValue)}
              </span>
            </DescriptionItem>
            <DescriptionItem label="Terakhir disusutkan">
              {depreciation.lastPeriod ? (
                formatPeriod(depreciation.lastPeriod)
              ) : (
                <span className="text-muted-foreground">Belum pernah</span>
              )}
            </DescriptionItem>
          </>
        ) : (
          <DescriptionItem label="Penyusutan">
            <span className="text-muted-foreground">Tidak disusutkan</span>
          </DescriptionItem>
        )}
      </DescriptionList>
    </Panel>
  );
};
