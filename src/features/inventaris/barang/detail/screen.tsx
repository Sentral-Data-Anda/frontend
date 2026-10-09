"use client";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/common/control";
import { EmptyState } from "@/components/common/feedback";
import { FormNotFound } from "@/components/common/form";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListReturn } from "@/hooks/use-list-return";
import { FetchError } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";

import { useAssetDetail } from "../api";
import { LabelLink, labelHrefOf } from "../label";
import { BARANG_LIST_PATH, barangEditHref, isActiveAsset } from "../model";

import { CycleActions } from "./cycle-actions";
import { DataPanel } from "./data-panel";
import { HistoryPanel } from "./history-panel";
import { PhotoGrid } from "./photo-grid";
import { StatusLine } from "./status-line";
import { ValuePanel } from "./value-panel";

const TITLE = "Asset Master";

interface PropTypes {
  code: string;
}

export const BarangDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.ASSET_MASTER);
  const { isCanView: isCanViewCycle } = useMenuAccess(MENU.ASSET_TRANSACTION);
  const listReturn = useListReturn(BARANG_LIST_PATH);
  const detail = useAssetDetail(isCanView ? code : undefined);
  const asset = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.FIXED_ASSET)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Asset Master"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="barang"
        backHref={listReturn}
        backLabel="Kembali ke Barang"
      />
    );
  }

  if (!asset) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat barang"
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
            className="flex flex-wrap items-start gap-x-6 gap-y-8 px-gutter pt-9"
          >
            <span className="grid min-w-0 flex-[1_1_20rem] grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
              {Array.from({ length: 2 }, (_, index) => (
                <span
                  key={index}
                  aria-hidden
                  className="bg-skeleton aspect-video animate-pulse rounded-control"
                />
              ))}
            </span>
            <span
              aria-hidden
              className="bg-skeleton h-72 flex-[999_1_32rem] animate-pulse rounded-lg"
            />
            <span className="sr-only">Memuat barang…</span>
          </div>
        )}
      </div>
    );
  }

  const isActive = isActiveAsset(asset);
  const isPhotoless = !asset.mainImage && asset.detailImage.length === 0;

  return (
    <div className="pb-8">
      <PageHeader
        title={asset.name}
        subtitle={`${asset.code} · ${asset.type.name}`}
        backHref={listReturn}
        isBackPersistent
        action={
          <>
            <LabelLink href={labelHrefOf({ kode: asset.code })} isIconOnly />
            {isCanUpdate && isActive ? (
              <Link
                href={barangEditHref(asset.code)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "shrink-0 cursor-pointer",
                )}
              >
                <Pencil aria-hidden />
                Ubah
              </Link>
            ) : null}
          </>
        }
      />

      {asset.disposal ? <StatusLine disposal={asset.disposal} /> : null}

      <div className="flex flex-wrap items-start gap-x-6 gap-y-8 px-gutter">
        <section
          aria-labelledby="asset-photos"
          className="min-w-0 flex-[1_1_20rem]"
        >
          <h2 id="asset-photos" className="mb-3 text-title font-semibold">
            Foto
          </h2>
          {isPhotoless ? (
            <EmptyState title="Belum ada foto barang" isCompact />
          ) : (
            <PhotoGrid
              mainImage={asset.mainImage}
              detailImage={asset.detailImage}
            />
          )}
        </section>

        <div className="flex min-w-0 flex-[999_1_32rem] flex-col gap-4">
          <DataPanel asset={asset} />
          <ValuePanel asset={asset} />
          {isActive ? <CycleActions code={asset.code} /> : null}
        </div>

        {isCanViewCycle ? (
          <div className="min-w-0 basis-full">
            <HistoryPanel assetId={asset.id} code={asset.code} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
