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

import { useCurrencyDetail } from "../api";
import { MATA_UANG_LIST_PATH, currencyEditHref } from "../model";

import { RateList } from "./rate-list";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Mata Uang";

interface PropTypes {
  code: string;
}

export const CurrencyDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanCreate, isCanUpdate } = useMenuAccess(MENU.CURRENCY);
  const listReturn = useListReturn(MATA_UANG_LIST_PATH);
  const detail = useCurrencyDetail(isCanView ? code : undefined);
  const currency = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.FINANCE)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Mata Uang"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="mata uang"
        backHref={listReturn}
        backLabel="Kembali ke Mata Uang"
      />
    );
  }

  if (!currency) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat mata uang"
              description={detail.error.message}
              action={
                <Button
                  type="button"
                  variant="outline"
                  disabled={detail.isFetching}
                  onClick={() => void detail.refetch()}
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
                <DescriptionSkeleton label="Memuat mata uang" rows={4} />
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
        title={`${currency.code} — ${currency.name}`}
        subtitle={`Simbol ${currency.symbol}`}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={currencyEditHref(currency.code)}
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
        <SummaryPanel currency={currency} isCanCreate={isCanCreate} />
      </div>

      {currency.isBase ? null : (
        <RateList currencyCode={currency.code} isCanUpdate={isCanUpdate} />
      )}
    </div>
  );
};
