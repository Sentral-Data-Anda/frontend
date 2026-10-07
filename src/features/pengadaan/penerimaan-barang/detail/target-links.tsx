import Link from "next/link";
import { Fragment } from "react";

import { DETAIL_LINK } from "@/components/common/display";
import { formatNumber } from "@/lib/format";

import {
  MAX_SHOWN_ASSETS,
  assetHref,
  stockItemHref,
  type ReceiptGroup,
} from "../model";

export const CODE_LINK = `tabular-nums ${DETAIL_LINK}`;

const codeLink = (code: string, href: string, isLinked: boolean) =>
  isLinked ? (
    <Link href={href} className={CODE_LINK}>
      {code}
    </Link>
  ) : (
    <span className="tabular-nums">{code}</span>
  );

interface PropTypes {
  group: ReceiptGroup;
  isAssetLinked: boolean;
  isStockLinked: boolean;
}

export const TargetLinks = (props: PropTypes) => {
  const { group, isAssetLinked, isStockLinked } = props;

  if (group.stockItem) {
    return (
      <>
        {"Persediaan "}
        {codeLink(
          group.stockItem.code,
          stockItemHref(group.stockItem.code),
          isStockLinked,
        )}
      </>
    );
  }

  const shown = group.assets.slice(0, MAX_SHOWN_ASSETS);
  const hidden = group.assets.length - shown.length;

  return (
    <>
      {"Barang "}
      {shown.map((asset, index) => (
        <Fragment key={asset.code}>
          {index > 0 ? ", " : null}
          {codeLink(asset.code, assetHref(asset.code), isAssetLinked)}
        </Fragment>
      ))}
      {hidden > 0 ? ` dan ${formatNumber(hidden)} lainnya` : null}
    </>
  );
};
