"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { ProgramListContent } from "./list-content";

export const ProgramListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PROGRAM);

  if (isCanView) return <ProgramListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Program" backHref={domainHref(MENU.ANGGARAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Program"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
