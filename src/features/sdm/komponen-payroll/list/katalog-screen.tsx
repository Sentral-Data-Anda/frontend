"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW_DESCRIPTION, NO_VIEW_TITLE } from "../model";

import { KatalogList } from "./katalog-list";

export const KatalogListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.KOMPONEN_PAYROLL);

  if (isCanView) return <KatalogList />;

  return (
    <div className="pb-6">
      <PageHeader title="Komponen Payroll" backHref={domainHref(MENU.SDM)} />

      <EmptyState title={NO_VIEW_TITLE} description={NO_VIEW_DESCRIPTION} />
    </div>
  );
};
