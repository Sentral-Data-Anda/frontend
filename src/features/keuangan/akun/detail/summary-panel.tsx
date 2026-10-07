import { BookOpen } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/common/control";
import {
  DETAIL_LINK,
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_LABEL } from "@/types/keuangan";

import { accountDetailHref, ledgerHref } from "../model";
import type { Account } from "../types";
import { AccountStatus } from "../ui";

interface PropTypes {
  account: Account;
  isCanViewLedger: boolean;
}

export const SummaryPanel = (props: PropTypes) => {
  const { account, isCanViewLedger } = props;

  return (
    <Panel label="Ringkasan akun">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{account.code}</span>
        </DescriptionItem>

        <DescriptionItem label="Nama">{account.name}</DescriptionItem>

        <DescriptionItem label="Tipe">
          {ACCOUNT_TYPE_LABEL[account.type]}
        </DescriptionItem>

        <DescriptionItem label="Akun induk">
          {account.parent ? (
            <Link
              href={accountDetailHref(account.parent.code)}
              className={DETAIL_LINK}
            >
              {account.parent.code} — {account.parent.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">Akun utama</span>
          )}
        </DescriptionItem>

        <DescriptionItem label="Status">
          <AccountStatus isActive={account.isActive} />
        </DescriptionItem>
      </DescriptionList>

      {isCanViewLedger ? (
        <div className="px-gutter pt-2 pb-4">
          <Link
            href={ledgerHref(account.code)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "cursor-pointer",
            )}
          >
            <BookOpen aria-hidden />
            Lihat buku besar
          </Link>
        </div>
      ) : null}
    </Panel>
  );
};
