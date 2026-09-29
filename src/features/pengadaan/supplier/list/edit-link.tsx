import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { SUPPLIER_LIST_PATH, supplierEditHref } from "../model";
import type { Supplier } from "../types";

interface PropTypes {
  supplier: Supplier;
}

export const EditLink = (props: PropTypes) => {
  const { supplier } = props;

  return (
    <Link
      href={supplierEditHref(supplier.code)}
      onClick={() => saveListFocus(SUPPLIER_LIST_PATH, supplier.code)}
      aria-label={`Ubah ${supplier.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
