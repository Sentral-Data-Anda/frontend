"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { SatuanList } from "./satuan-list";

export const SatuanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SATUAN);

  if (isCanView) return <SatuanList />;

  return (
    <div className="pb-6">
      <PageHeader title="Satuan" backHref={domainHref(MENU.INVENTARIS)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Satuan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
