"use client";

import Link from "next/link";

import { DETAIL_LINK } from "@/components/common/display";
import type { MenuSlug } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

interface PropTypes {
  menu: MenuSlug;
  href: string;
  children: React.ReactNode;
}

export const RecordLink = (props: PropTypes) => {
  const { menu, href, children } = props;

  const { isCanView } = useMenuAccess(menu);

  if (!isCanView) return children;

  return (
    <Link href={href} className={DETAIL_LINK}>
      {children}
    </Link>
  );
};
