import { ArrowLeftRight, PackageX, Wrench } from "lucide-react";

import { buttonVariants } from "@/components/common/control";
import { AppLink } from "@/components/common/link";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { cycleCreateHref } from "../model";

const ACTION = "cursor-pointer";

interface PropTypes {
  code: string;
}

export const CycleActions = (props: PropTypes) => {
  const { code } = props;

  const { isCanCreate, isCanDelete } = useMenuAccess(MENU.ASSET_TRANSACTION);

  if (!isCanCreate && !isCanDelete) return null;

  return (
    <nav aria-label="Siklus barang" className="flex flex-wrap gap-2">
      {isCanCreate ? (
        <>
          <AppLink
            href={cycleCreateHref("perawatan", code)}
            className={cn(buttonVariants({ variant: "outline" }), ACTION)}
          >
            <Wrench aria-hidden />
            Catat perawatan
          </AppLink>
          <AppLink
            href={cycleCreateHref("pindah", code)}
            className={cn(buttonVariants({ variant: "outline" }), ACTION)}
          >
            <ArrowLeftRight aria-hidden />
            Pindahkan
          </AppLink>
        </>
      ) : null}
      {isCanDelete ? (
        <AppLink
          href={cycleCreateHref("pelepasan", code)}
          className={cn(buttonVariants({ variant: "destructive" }), ACTION)}
        >
          <PackageX aria-hidden />
          Ajukan pelepasan
        </AppLink>
      ) : null}
    </nav>
  );
};
