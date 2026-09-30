"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { SettingListContent } from "./list-content";

export const SettingListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SETELAN_AKUNTANSI);

  if (isCanView) return <SettingListContent />;

  return (
    <div className="pb-6">
      <PageHeader
        title="Setelan Akuntansi"
        backHref={domainHref(MENU.KEUANGAN)}
      />

      <EmptyState
        title="Anda tidak memiliki akses ke Setelan Akuntansi"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
