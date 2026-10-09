"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TipeCutiList } from "./tipe-cuti-list";

export const TipeCutiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.LEAVE_TYPE);

  if (isCanView) return <TipeCutiList />;

  return (
    <div className="pb-6">
      <PageHeader title="Leave Type" backHref={domainHref(MENU.HR)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Leave Type"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
