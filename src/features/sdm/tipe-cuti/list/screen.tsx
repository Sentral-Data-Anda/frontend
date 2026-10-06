"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TipeCutiList } from "./tipe-cuti-list";

export const TipeCutiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.TIPE_CUTI);

  if (isCanView) return <TipeCutiList />;

  return (
    <div className="pb-6">
      <PageHeader title="Tipe Cuti" backHref={domainHref(MENU.SDM)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Tipe Cuti"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
