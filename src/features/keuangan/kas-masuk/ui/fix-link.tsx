"use client";

import Link from "next/link";

import type { MenuSlug } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TEXT_LINK } from "../model";

interface PropTypes {
  fix: { menu: MenuSlug; href: string; label: string };
}

export const FixLink = (props: PropTypes) => {
  const { fix } = props;

  const { isCanView } = useMenuAccess(fix.menu);

  return isCanView ? (
    <p className="text-body">
      <Link href={fix.href} className={TEXT_LINK}>
        {fix.label}
      </Link>
    </p>
  ) : null;
};
