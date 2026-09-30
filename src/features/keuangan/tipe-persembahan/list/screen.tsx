"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { OfferingTypeListContent } from "./list-content";

export const OfferingTypeListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.TIPE_PERSEMBAHAN);

  if (isCanView) return <OfferingTypeListContent />;

  return (
    <div className="pb-6">
      <PageHeader
        title="Tipe Persembahan"
        backHref={domainHref(MENU.KEUANGAN)}
      />

      <EmptyState
        title="Anda tidak memiliki akses ke Tipe Persembahan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
