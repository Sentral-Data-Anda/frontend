"use client";

import Link from "next/link";

import { DETAIL_LINK as LINK } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { fixLinkOf } from "../model";

interface PropTypes {
  error: unknown;
}

/**
 * Setiap pesan server yang menyebut akun, setelan, tipe, atau periode dirender
 * dengan tautan ke layar yang memperbaikinya. Slug cadangan tidak pernah
 * dipakai memutuskan: tanpa `fix` komponen ini tidak merender apa pun.
 */
export const FixLink = (props: PropTypes) => {
  const { error } = props;

  const fix = fixLinkOf(error);
  const { isCanView } = useMenuAccess(fix?.menu ?? MENU.PERSEMBAHAN);

  if (!fix || !isCanView) return null;

  return (
    <Link href={fix.href} className={LINK}>
      {fix.label}
    </Link>
  );
};
