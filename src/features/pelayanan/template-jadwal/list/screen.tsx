"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TemplateJadwalList } from "./template-jadwal-list";

export const TemplateJadwalListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.TEMPLATE_JADWAL);

  if (isCanView) return <TemplateJadwalList />;

  return (
    <div className="pb-6">
      <PageHeader
        title="Template Jadwal"
        backHref={domainHref(MENU.PELAYANAN)}
      />

      <EmptyState
        title="Anda tidak memiliki akses ke Template Jadwal"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
