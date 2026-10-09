"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW_DESCRIPTION, NO_VIEW_TITLE } from "../model";

import { KontrakListContent } from "./list-content";

export const KontrakListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.EMPLOYEE_CONTRACT);

  if (isCanView) return <KontrakListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Kontrak Karyawan" backHref={domainHref(MENU.HR)} />

      <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
    </div>
  );
};
