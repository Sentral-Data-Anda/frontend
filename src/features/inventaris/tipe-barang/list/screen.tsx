"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TipeBarangList } from "./tipe-barang-list";

export const TipeBarangListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.ITEM_CATEGORY);

  if (isCanView) return <TipeBarangList />;

  return (
    <div className="pb-6">
      <PageHeader title="Item Category" backHref={domainHref(MENU.INVENTORY)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Item Category"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
