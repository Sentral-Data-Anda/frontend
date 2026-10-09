"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW_DESCRIPTION, NO_VIEW_TITLE } from "../model";

import { PenetapanList } from "./penetapan-list";

export const PenetapanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PAYROLL_COMPONENT);

  if (isCanView) return <PenetapanList />;

  return (
    <div className="pb-6">
      <PageHeader title="Penetapan Komponen" backHref={domainHref(MENU.HR)} />

      <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
    </div>
  );
};
