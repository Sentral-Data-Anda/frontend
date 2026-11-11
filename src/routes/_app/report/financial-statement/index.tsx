import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { LaporanKeuanganScreen } from "@/features/keuangan/laporan-keuangan";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <LaporanKeuanganScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/report/financial-statement/")({
  head: () => ({ meta: [{ title: withSiteName("Financial Statement") }] }),
  component: Page,
});
