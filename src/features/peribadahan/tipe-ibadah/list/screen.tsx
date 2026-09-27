"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TipeIbadahList } from "./tipe-ibadah-list";

export const TipeIbadahListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.TIPE_IBADAH);

  if (isCanView) return <TipeIbadahList />;

  return (
    <div className="pb-6">
      <PageHeader title="Tipe Ibadah" backHref={domainHref(MENU.PERIBADAHAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Tipe Ibadah"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
