"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";

import { useStockDetail } from "../api";
import { STOCK_LIST_PATH, stockEditHref } from "../model";

import { DataPanel } from "./data-panel";
import { MovementList } from "./movement-list";
import { StockPanel } from "./stock-panel";

const TITLE = "Barang Persediaan";

interface PropTypes {
  code: string;
}

export const StockDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.BARANG_PERSEDIAAN);
  const { isCanView: isCanViewMovement } = useMenuAccess(MENU.MUTASI_STOK);
  const listReturn = useListReturn(STOCK_LIST_PATH);
  const detail = useStockDetail(isCanView ? code : undefined);
  const item = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.INVENTARIS)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Barang Persediaan"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="barang persediaan"
        backHref={listReturn}
        backLabel="Kembali ke Barang Persediaan"
      />
    );
  }

  if (!item) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat barang persediaan"
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
          <div
            role="status"
            aria-busy="true"
            className="flex flex-wrap items-start gap-x-6 gap-y-6 px-gutter pt-2"
          >
            <span
              aria-hidden
              className="bg-skeleton h-28 w-full animate-pulse rounded-lg"
            />
            <span
              aria-hidden
              className="bg-skeleton h-48 flex-[1_1_24rem] animate-pulse rounded-lg"
            />
            <span
              aria-hidden
              className="bg-skeleton h-48 flex-[1_1_24rem] animate-pulse rounded-lg"
            />
            <span className="sr-only">Memuat barang persediaan…</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={item.name}
        subtitle={`${item.code} · ${item.type.name}`}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={stockEditHref(item.code)}
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
        <StockPanel item={item} />
      </div>

      <div className="flex flex-wrap items-start gap-x-6 gap-y-8 px-gutter pt-6">
        <div className="min-w-0 flex-[1_1_24rem]">
          <DataPanel item={item} />
        </div>

        {isCanViewMovement ? (
          <Panel
            label="Riwayat stok"
            className="flex-[1_1_24rem] px-gutter py-4"
          >
            <h2 className="mb-1 text-title font-semibold">Riwayat stok</h2>
            <MovementList stockItemId={item.id} code={item.code} />
          </Panel>
        ) : null}
      </div>
    </div>
  );
};
