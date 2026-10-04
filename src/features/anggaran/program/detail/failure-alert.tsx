"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { MENU, type MenuSlug } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { errorFixOf, type FixTarget } from "../model";

interface PropTypes {
  title: string;
  error: Error;
  target: FixTarget;
}

export const FailureAlert = (props: PropTypes) => {
  const { title, error, target } = props;

  const ceiling = useMenuAccess(MENU.PAGU_ANGGARAN);
  const workflow = useMenuAccess(MENU.SETELAN_PERSETUJUAN);
  const roleJemaat = useMenuAccess(MENU.ROLE_JEMAAT);
  const account = useMenuAccess(MENU.AKUN);
  const fix = errorFixOf(error, target);
  const gates: Partial<Record<MenuSlug, boolean>> = {
    [MENU.PAGU_ANGGARAN]: ceiling.isCanView,
    [MENU.SETELAN_PERSETUJUAN]: workflow.isCanView,
    [MENU.ROLE_JEMAAT]: roleJemaat.isCanView,
    [MENU.AKUN]: account.isCanView,
  };
  const isFixVisible = fix !== null && gates[fix.menu] === true;

  return (
    <div className="space-y-2">
      <FormAlert title={title} message={error.message} />

      {fix && isFixVisible ? (
        <Link
          href={fix.href}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {fix.label}
        </Link>
      ) : null}
    </div>
  );
};
