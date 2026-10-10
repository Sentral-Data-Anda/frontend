"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { DescriptionSkeleton, Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";
import { ACCOUNT_TYPE_LABEL } from "@/types/keuangan";

import { useAccountDetail } from "../api";
import { AKUN_LIST_PATH, accountEditHref } from "../model";

import { ChildList } from "./child-list";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Chart of Account";

interface PropTypes {
  code: string;
}

export const AccountDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.CHART_OF_ACCOUNT);
  const ledger = useMenuAccess(MENU.FINANCIAL_STATEMENT);
  const listReturn = useListReturn(AKUN_LIST_PATH);
  const detail = useAccountDetail(isCanView ? code : undefined);
  const account = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.FINANCE)} />

        <EmptyState
          title="Anda tidak memiliki akses ke Chart of Account"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="akun"
        backHref={listReturn}
        backLabel="Kembali ke Akun"
      />
    );
  }

  if (!account) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat akun"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
                  isLoading={detail.isFetching}
                >
                  {detail.isFetching ? "Memuat…" : "Coba lagi"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="px-gutter">
            <Panel>
              <div className="px-gutter py-2">
                <DescriptionSkeleton label="Memuat akun" rows={5} />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={`${account.code} — ${account.name}`}
        subtitle={ACCOUNT_TYPE_LABEL[account.type]}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={accountEditHref(account.code)}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 cursor-pointer",
              )}
            >
              <Pencil aria-hidden />
              Ubah
            </Link>
          ) : null
        }
      />

      <div className="px-gutter">
        <SummaryPanel account={account} isCanViewLedger={ledger.isCanView} />
      </div>

      <ChildList account={account} />
    </div>
  );
};
