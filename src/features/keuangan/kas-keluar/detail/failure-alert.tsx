"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { errorFixOf } from "../model";

interface PropTypes {
  title: string;
  error: Error;
}

export const FailureAlert = (props: PropTypes) => {
  const { title, error } = props;

  const { isCanView: isCanViewPeriod } = useMenuAccess(MENU.PERIODE_FISKAL);
  const { isCanView: isCanViewAccount } = useMenuAccess(MENU.AKUN);
  const fix = errorFixOf(error);
  const isFixVisible =
    fix !== null &&
    (fix.menu === MENU.PERIODE_FISKAL ? isCanViewPeriod : isCanViewAccount);

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
