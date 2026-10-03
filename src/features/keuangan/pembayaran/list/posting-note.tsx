"use client";

import { HandCoins, Stamp } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import {
  PAYMENT_POSTING_PATH,
  POSTING_PERSEMBAHAN_PATH,
  ROUTE_NOTE,
} from "../model";

const LINK = cn(buttonVariants({ variant: "outline" }), "cursor-pointer");

export const PostingNote = () => {
  const { isCanCreate } = useMenuAccess(MENU.JURNAL);

  return (
    <Panel className="mx-gutter mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-gutter py-3">
        <p className="text-muted-foreground min-w-0 flex-1 basis-64 text-body">
          {ROUTE_NOTE}
        </p>

        {isCanCreate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link href={POSTING_PERSEMBAHAN_PATH} className={LINK}>
              <HandCoins aria-hidden />
              Posting persembahan
            </Link>

            <Link href={PAYMENT_POSTING_PATH} className={LINK}>
              <Stamp aria-hidden />
              Posting pendaftaran event
            </Link>
          </div>
        ) : null}
      </div>
    </Panel>
  );
};
