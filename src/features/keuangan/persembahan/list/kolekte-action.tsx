import { Receipt } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { PageHeaderAdd } from "@/components/layout";
import { cn } from "@/lib/utils";

import { KOLEKTE_PATH, PERSEMBAHAN_CREATE_PATH } from "../model";

/** Catat Kolekte adalah jalur tiap Minggu, jadi ia tombol utamanya; catat satu
 * tetap terjangkau di sebelahnya untuk transfer susulan dan koreksi. */
export const KolekteAction = () => (
  <div className="flex items-center gap-1.5">
    <Link
      href={PERSEMBAHAN_CREATE_PATH}
      aria-label="Catat satu persembahan"
      title="Catat satu persembahan"
      className={cn(
        buttonVariants({ variant: "outline", size: "icon" }),
        "cursor-pointer rounded-full",
      )}
    >
      <Receipt aria-hidden />
    </Link>

    <PageHeaderAdd href={KOLEKTE_PATH} label="Catat Kolekte" text="Kolekte" />
  </div>
);
