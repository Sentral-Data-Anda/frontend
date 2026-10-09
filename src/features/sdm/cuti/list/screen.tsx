"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { CutiList } from "./cuti-list";

export const CutiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.LEAVE);

  if (isCanView) return <CutiList />;

  return (
    <div className="pb-6">
      <PageHeader title="Leave" backHref={domainHref(MENU.HR)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Leave"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
