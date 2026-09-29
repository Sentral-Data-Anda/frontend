import { Badge } from "@/components/common/display";

import {
  ASSET_STATUS_LABEL,
  assetStatusOf,
  type AssetStatusKey,
} from "../model";
import type { Asset } from "../types";

const VARIANT = {
  BAIK: "success",
  RUSAK_RINGAN: "draft",
  RUSAK_BERAT: "due",
  HILANG: "neutral",
  MENUNGGU_PELEPASAN: "wait",
  DILEPAS: "neutral",
} as const satisfies Record<AssetStatusKey, string>;

interface PropTypes {
  asset: Pick<Asset, "status" | "condition">;
}

export const AssetStatusBadge = (props: PropTypes) => {
  const { asset } = props;

  const status = assetStatusOf(asset);

  return <Badge variant={VARIANT[status]}>{ASSET_STATUS_LABEL[status]}</Badge>;
};
