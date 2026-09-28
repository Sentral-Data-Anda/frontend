"use client";

import Link from "next/link";

import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { assetHref } from "./model";
import type { Place } from "./types";

const LINK =
  "text-primary cursor-pointer underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary";

interface PropTypes {
  asset: Place;
}

export const AssetLink = (props: PropTypes) => {
  const { asset } = props;

  const { isCanView } = useMenuAccess(MENU.BARANG);

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
