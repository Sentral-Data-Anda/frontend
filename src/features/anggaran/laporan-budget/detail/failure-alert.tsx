"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { MENU, type MenuSlug } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { errorFixOf } from "../model";

interface PropTypes {
  title: string;
  error: Error;
}

export const FailureAlert = (props: PropTypes) => {
  const { title, error } = props;

  const workflow = useMenuAccess(MENU.SETELAN_PERSETUJUAN);
  const roleJemaat = useMenuAccess(MENU.ROLE_JEMAAT);
  const account = useMenuAccess(MENU.AKUN);
  const fix = errorFixOf(error);
  const gates: Partial<Record<MenuSlug, boolean>> = {
    [MENU.SETELAN_PERSETUJUAN]: workflow.isCanView,
    [MENU.ROLE_JEMAAT]: roleJemaat.isCanView,
    [MENU.AKUN]: account.isCanView,
  };

  return (
    <div className="space-y-2">
      <FormAlert title={title} message={error.message} />

      {fix && gates[fix.menu] === true ? (
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
