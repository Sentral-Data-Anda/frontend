import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { BARANG_LIST_PATH, barangEditHref } from "../model";
import type { Asset } from "../types";

interface PropTypes {
  asset: Asset;
}

export const EditLink = (props: PropTypes) => {
  const { asset } = props;

  return (
    <Link
      href={barangEditHref(asset.code)}
      onClick={() => saveListFocus(BARANG_LIST_PATH, asset.code)}
      aria-label={`Ubah ${asset.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
