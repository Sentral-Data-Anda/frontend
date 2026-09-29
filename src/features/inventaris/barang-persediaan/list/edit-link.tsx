import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { STOCK_LIST_PATH, stockEditHref } from "../model";
import type { StockItem } from "../types";

interface PropTypes {
  item: StockItem;
}

export const EditLink = (props: PropTypes) => {
  const { item } = props;

  return (
    <Link
      href={stockEditHref(item.code)}
      onClick={() => saveListFocus(STOCK_LIST_PATH, item.code)}
      aria-label={`Ubah ${item.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
