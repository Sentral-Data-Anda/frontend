import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { cn } from "@/lib/utils";

import { supplierOrdersHref } from "../model";

interface PropTypes {
  supplierId: number;
}

export const OrdersPanel = (props: PropTypes) => {
  const { supplierId } = props;

  return (
    <Panel label="Pesanan" className="space-y-3 px-gutter py-4">
      <h2 className="text-title font-semibold">Pesanan</h2>
      <p className="text-muted-foreground text-body">
        Pesanan pembelian yang dikirim ke supplier ini.
      </p>
      <Link
        href={supplierOrdersHref(supplierId)}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full cursor-pointer justify-between",
        )}
      >
        Lihat pesanan supplier ini
        <ChevronRight aria-hidden />
      </Link>
    </Panel>
  );
};
