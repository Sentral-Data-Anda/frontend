import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  ReportListScreen,
  reportTable,
} from "@/features/anggaran/laporan-budget/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={reportTable()} />}
      >
        <ReportListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/report/budget-realization/")({
  head: () => ({ meta: [{ title: withSiteName("Budget Realization") }] }),
  component: Page,
});
