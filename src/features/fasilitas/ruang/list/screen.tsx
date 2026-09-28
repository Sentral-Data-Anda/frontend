"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { RuangListContent } from "./list-content";

export const RuangListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.RUANG);

  return isCanView ? (
    <RuangListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Ruang" backHref={domainHref(MENU.FASILITAS)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Ruang"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
