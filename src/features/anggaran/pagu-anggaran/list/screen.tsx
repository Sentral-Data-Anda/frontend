"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { AllocationListContent } from "./list-content";

export const AllocationListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.BUDGET);

  if (isCanView) return <AllocationListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Pagu Anggaran" backHref={domainHref(MENU.BUDGETING)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Pagu Anggaran"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
