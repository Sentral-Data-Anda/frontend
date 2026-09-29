import { Pencil } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import { saveListFocus } from "@/lib/list-return";
import { cn } from "@/lib/utils";

import { AKUN_LIST_PATH, accountEditHref } from "../model";
import type { Account } from "../types";

interface PropTypes {
  account: Account;
}

export const EditLink = (props: PropTypes) => {
  const { account } = props;

  return (
    <Link
      href={accountEditHref(account.code)}
      onClick={() => saveListFocus(AKUN_LIST_PATH, account.code)}
      aria-label={`Ubah akun ${account.code} ${account.name}`}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon-sm" }),
        "relative cursor-pointer",
      )}
    >
      <Pencil aria-hidden />
    </Link>
  );
};
