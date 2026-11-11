import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { ReportJemaatScreen } from "@/features/kejemaatan/report-jemaat";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense>
        <ReportJemaatScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/report/report-jemaat/")({
  head: () => ({ meta: [{ title: withSiteName("Laporan Jemaat") }] }),
  component: Page,
});
