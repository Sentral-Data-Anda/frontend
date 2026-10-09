"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PenyusutanListContent } from "./list-content";

export const PenyusutanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.DEPRECIATION);

  if (isCanView) return <PenyusutanListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Penyusutan" backHref={domainHref(MENU.FIXED_ASSET)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Penyusutan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
