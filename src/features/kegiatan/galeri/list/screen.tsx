"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { GaleriListContent } from "./list-content";

export const GaleriListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.GALERI);

  return isCanView ? (
    <GaleriListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Galeri" backHref={domainHref(MENU.KEGIATAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Galeri"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
