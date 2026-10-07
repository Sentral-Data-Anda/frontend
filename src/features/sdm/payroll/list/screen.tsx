"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW_DESCRIPTION, NO_VIEW_TITLE } from "../model";

import { PayrollListContent } from "./list-content";

export const PayrollListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PAYROLL);

  if (isCanView) return <PayrollListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Penggajian" backHref={domainHref(MENU.SDM)} />

      <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
    </div>
  );
};
