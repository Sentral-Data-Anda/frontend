"use client";

import Link from "next/link";

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
    <Link
      href={href}
      className="text-primary decoration-primary/40 hover:decoration-primary focus-visible:ring-ring relative rounded-sm underline after:absolute after:-inset-2.5 underline-offset-4 outline-none focus-visible:ring-2"
    >
      {children}
    </Link>
  );
};
