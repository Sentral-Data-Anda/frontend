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

import { useSupplierDetail } from "../api";
import { SUPPLIER_LIST_PATH, supplierEditHref } from "../model";

import { OrdersPanel } from "./orders-panel";
import { ProfilePanel } from "./profile-panel";

const TITLE = "Supplier";

interface PropTypes {
  code: string;
}

export const SupplierDetailScreen = (props: PropTypes) => {
  const { code } = props;

  const { isCanView, isCanUpdate } = useMenuAccess(MENU.SUPPLIER);
  const orderAccess = useMenuAccess(MENU.PESANAN_PEMBELIAN);
  const listReturn = useListReturn(SUPPLIER_LIST_PATH);
  const detail = useSupplierDetail(isCanView ? code : undefined);
  const supplier = detail.data;
  const isNotFound =
    detail.error instanceof FetchError && detail.error.status === 404;

  if (!isCanView) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={domainHref(MENU.PENGADAAN)} />
        <EmptyState
          title="Anda tidak memiliki akses ke Supplier"
          description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <FormNotFound
        noun="supplier"
        backHref={listReturn}
        backLabel="Kembali ke Supplier"
      />
    );
  }

  if (!supplier) {
    return (
      <div className="pb-8">
        <PageHeader title={TITLE} backHref={listReturn} isBackPersistent />

        {detail.error ? (
          <div role="alert">
            <EmptyState
              title="Gagal memuat supplier"
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
                <DescriptionSkeleton label="Memuat supplier" rows={7} />
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
        title={supplier.name}
        subtitle={supplier.code}
        backHref={listReturn}
        isBackPersistent
        action={
          isCanUpdate ? (
            <Link
              href={supplierEditHref(supplier.code)}
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

      <div className="flex flex-wrap items-start gap-4 px-gutter">
        <div className="min-w-0 flex-[999_1_32rem]">
          <ProfilePanel supplier={supplier} />
        </div>

        {orderAccess.isCanView ? (
          <div className="min-w-0 flex-[1_1_20rem]">
            <OrdersPanel supplierId={supplier.id} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
