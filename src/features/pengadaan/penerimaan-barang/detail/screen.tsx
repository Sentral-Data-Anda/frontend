"use client";

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
import { formatDate, formatNumber } from "@/lib/format";

import { useReceiptDetail } from "../api";
import {
  RECEIPT_LIST_PATH,
  assetEditHref,
  groupItems,
  supplierNameOf,
} from "../model";

import { AttachmentList } from "./attachment-list";
import { ItemList } from "./item-list";
import { SummaryPanel } from "./summary-panel";

const TITLE = "Penerimaan Barang";

const FINAL_NOTE =
  "Penerimaan tidak bisa diubah atau dihapus. Salah catat diperbaiki di Inventaris: Mutasi Stok Keluar untuk barang persediaan, Pelepasan di Siklus Aset untuk barang.";

interface PropTypes {
  code: string;
}

export const ReceiptDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView } = useMenuAccess(MENU.PENERIMAAN_BARANG);
  const orderAccess = useMenuAccess(MENU.PESANAN_PEMBELIAN);
  const assetAccess = useMenuAccess(MENU.BARANG);
  const stockAccess = useMenuAccess(MENU.BARANG_PERSEDIAAN);
  const listReturn = useListReturn(RECEIPT_LIST_PATH);
  const detail = useReceiptDetail(isCanView ? code : undefined);
  const receipt = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.PENGADAAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Penerimaan Barang"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="penerimaan barang"
        backHref={listReturn}
        backLabel="Kembali ke Penerimaan Barang"
      />
    );
  }

  if (!receipt) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat penerimaan barang"
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
                <DescriptionSkeleton
                  label="Memuat penerimaan barang"
                  rows={4}
                />
              </div>
            </Panel>
          </div>
        )}
      </div>
    );
  }

  const groups = groupItems(receipt.items);
  const firstAsset = groups.flatMap((group) => group.assets)[0];
  const assetCount = receipt.items.filter((item) => item.asset).length;

  return (
    <div className="pb-8">
      <PageHeader
        title={supplierNameOf(receipt)}
        subtitle={`${receipt.code} · ${formatDate(receipt.receivedDate)}`}
        backHref={listReturn}
        isBackPersistent
      />

      <div className="space-y-4 px-gutter pb-4">
        <SummaryPanel receipt={receipt} isOrderLinked={orderAccess.isCanView} />

        <p className="text-muted-foreground text-body">{FINAL_NOTE}</p>

        {firstAsset && assetAccess.isCanUpdate ? (
          <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-control border px-4 py-3">
            <p className="min-w-0 flex-[1_1_18rem] text-body">
              {`${formatNumber(assetCount)} barang baru belum punya nomor seri, foto, dan penyusutan. Lengkapi lewat kode barangnya di bawah.`}
            </p>
            <Link
              href={assetEditHref(firstAsset.code)}
              className={buttonVariants({ variant: "outline" })}
            >
              Lengkapi data barang
            </Link>
          </div>
        ) : null}

        <h2 className="text-title pt-2 font-semibold">Barang yang diterima</h2>
      </div>

      <ItemList
        groups={groups}
        currencyCode={receipt.purchaseOrder.currencyCode}
        isAssetLinked={assetAccess.isCanView}
        isStockLinked={stockAccess.isCanView}
        isRefreshing={detail.isFetching}
      />

      <section
        aria-labelledby="receipt-proof"
        className="space-y-3 px-gutter pt-6"
      >
        <h2 id="receipt-proof" className="text-title font-semibold">
          Nota / surat jalan
        </h2>
        {receipt.attachments.length > 0 ? (
          <AttachmentList attachments={receipt.attachments} />
        ) : (
          <EmptyState title="Tanpa nota atau surat jalan" isCompact />
        )}
      </section>
    </div>
  );
};
