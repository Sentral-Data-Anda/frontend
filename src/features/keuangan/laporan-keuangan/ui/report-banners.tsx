"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import {
  CLOSING_MESSAGE,
  CLOSING_TITLE,
  JURNAL_CREATE_PATH,
  OPENING_MESSAGE,
  OPENING_TITLE,
  UNBALANCED_MESSAGE,
  UNBALANCED_TITLE,
} from "../model";
import type { Neraca } from "../types";

interface PropTypes {
  neraca: Neraca | undefined;
}

export const ReportBanners = (props: PropTypes) => {
  const { neraca } = props;

  const { isCanCreate } = useMenuAccess(MENU.JURNAL);

  return (
    <div className="space-y-2 px-gutter pb-4">
      {neraca && !neraca.balanced ? (
        <FormAlert
          tone="error"
          title={UNBALANCED_TITLE}
          message={UNBALANCED_MESSAGE}
        />
      ) : null}

      {neraca && !neraca.isOpeningEntered ? (
        <div className="flex flex-col items-start gap-2">
          <FormAlert
            tone="warning"
            title={OPENING_TITLE}
            message={OPENING_MESSAGE}
          />

          {isCanCreate ? (
            <Link
              href={JURNAL_CREATE_PATH}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "cursor-pointer",
              )}
            >
              Masukkan saldo awal
            </Link>
          ) : null}
        </div>
      ) : null}

      <FormAlert
        tone="warning"
        title={CLOSING_TITLE}
        message={CLOSING_MESSAGE}
      />
    </div>
  );
};
