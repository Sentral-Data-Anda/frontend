"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { TEXT_LINK, fixOfCode } from "../model";

interface PropTypes {
  code: string | null | undefined;
  isPlain?: boolean;
}

export const FixLink = (props: PropTypes) => {
  const { code, isPlain = false } = props;

  const fix = fixOfCode(code);
  const { isCanView } = useMenuAccess(fix?.menu ?? MENU.JURNAL);

  if (!fix || !isCanView) return null;

  return (
    <Link
      href={fix.href}
      className={cn(
        isPlain
          ? TEXT_LINK
          : [buttonVariants({ variant: "outline" }), "cursor-pointer"],
      )}
    >
      {fix.label}
    </Link>
  );
};
