import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { movementCreateHref } from "../model";
import type { StockItem } from "../types";
import { StockStatus } from "../ui";

interface PropTypes {
  item: StockItem;
}

export const StockPanel = (props: PropTypes) => {
  const { item } = props;

  const { isCanCreate: isCanCreateMovement } = useMenuAccess(
    MENU.STOCK_MOVEMENT,
  );

  return (
    <Panel
      label="Stok"
      className="flex flex-wrap items-end justify-between gap-4 px-gutter py-4"
    >
      <div className="min-w-0">
        <p className="text-muted-foreground text-body">Stok sekarang</p>
        <p className="flex items-baseline gap-2">
          <span className="text-kpi font-semibold tracking-tight tabular-nums">
            {formatNumber(item.quantity)}
          </span>
          <span className="text-lead">{item.unit.name}</span>
        </p>
        <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body">
          <StockStatus item={item} />
          <span className="tabular-nums">
            {item.reorderPoint === null
              ? "Tanpa batas menipis"
              : `Batas menipis ${formatNumber(item.reorderPoint)} ${item.unit.name}`}
          </span>
        </p>
      </div>

      {isCanCreateMovement ? (
        <Link
          href={movementCreateHref(item.code)}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "shrink-0 cursor-pointer",
          )}
        >
          <ArrowLeftRight aria-hidden />
          Catat mutasi
        </Link>
      ) : null}
    </Panel>
  );
};
