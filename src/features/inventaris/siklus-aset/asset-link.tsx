"use client";

import Link from "next/link";

import { DETAIL_LINK as LINK } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { assetHref } from "./model";
import type { Place } from "./types";

interface PropTypes {
  asset: Place;
}

export const AssetLink = (props: PropTypes) => {
  const { asset } = props;

  const { isCanView } = useMenuAccess(MENU.ASSET_MASTER);

  return (
    <>
      {isCanView ? (
        <Link href={assetHref(asset.code)} className={LINK}>
          {asset.name}
        </Link>
      ) : (
        asset.name
      )}{" "}
      <span className="text-muted-foreground font-normal tabular-nums">
        {asset.code}
      </span>
    </>
  );
};
