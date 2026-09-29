"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TipeBarangList } from "./tipe-barang-list";

export const TipeBarangListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.TIPE_BARANG);

  if (isCanView) return <TipeBarangList />;

  return (
    <div className="pb-6">
      <PageHeader title="Tipe Barang" backHref={domainHref(MENU.INVENTARIS)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Tipe Barang"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
