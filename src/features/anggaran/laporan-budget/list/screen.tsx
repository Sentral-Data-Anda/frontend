"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW } from "../model";

import { ReportListContent } from "./list-content";

export const ReportListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.LAPORAN_BUDGET);

  if (isCanView) return <ReportListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Laporan Budget" backHref={domainHref(MENU.ANGGARAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Laporan Budget"
        description={NO_VIEW}
      />
    </div>
  );
};
