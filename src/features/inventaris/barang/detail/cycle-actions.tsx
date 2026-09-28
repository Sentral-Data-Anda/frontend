"use client";

import { ArrowLeftRight, PackageX, Wrench } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
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

  const { isCanCreate, isCanDelete } = useMenuAccess(MENU.SIKLUS_ASET);

  if (!isCanCreate && !isCanDelete) return null;

  return (
    <nav aria-label="Siklus barang" className="flex flex-wrap gap-2">
      {isCanCreate ? (
        <>
          <Link
            href={cycleCreateHref("perawatan", code)}
            className={cn(buttonVariants({ variant: "outline" }), ACTION)}
          >
            <Wrench aria-hidden />
            Catat perawatan
          </Link>
          <Link
            href={cycleCreateHref("pindah", code)}
            className={cn(buttonVariants({ variant: "outline" }), ACTION)}
          >
            <ArrowLeftRight aria-hidden />
            Pindahkan
          </Link>
        </>
      ) : null}
      {isCanDelete ? (
        <Link
          href={cycleCreateHref("pelepasan", code)}
          className={cn(buttonVariants({ variant: "destructive" }), ACTION)}
        >
          <PackageX aria-hidden />
          Ajukan pelepasan
        </Link>
      ) : null}
    </nav>
  );
};
