"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { CutiList } from "./cuti-list";

export const CutiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.CUTI);

  if (isCanView) return <CutiList />;

  return (
    <div className="pb-6">
      <PageHeader title="Cuti" backHref={domainHref(MENU.SDM)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Cuti"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
