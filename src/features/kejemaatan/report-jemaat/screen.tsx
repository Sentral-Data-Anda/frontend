"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { useListParams, type ListFilterSchema } from "@/hooks/use-list-params";

import { readMonth } from "./model";
import { ReportBody } from "./ui/report-body";

const REPORT_FILTERS = { bulan: { api: "bulan" } } satisfies ListFilterSchema;

export const ReportJemaatScreen = () => {
  const { isCanView } = useMenuAccess(MENU.REPORT_JEMAAT);
  const listParams = useListParams({ filters: REPORT_FILTERS });
  const month = readMonth(listParams.filters.bulan);

  return (
    <div className="pb-6">
      <PageHeader title="Laporan Jemaat" backHref={domainHref(MENU.REPORT)} />

      {isCanView ? (
        <ReportBody
          month={month}
          onPickMonth={(value) => listParams.onPickFilter("bulan", value)}
        />
      ) : (
        <EmptyState
          title="Anda tidak memiliki akses ke Laporan Jemaat"
          description="Hubungi administrator bila Anda memerlukan akses ini."
        />
      )}
    </div>
  );
};
