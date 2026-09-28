"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PendaftaranListContent } from "./list-content";

export const PendaftaranListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PENDAFTARAN_EVENT);

  return isCanView ? (
    <PendaftaranListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Pendaftaran Event"
        backHref={domainHref(MENU.KEGIATAN)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Pendaftaran Event"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
