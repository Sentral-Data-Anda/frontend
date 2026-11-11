import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { LaporanAsetScreen } from "@/features/inventaris/laporan-aset";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <LaporanAsetScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/report/asset-report/")({
  head: () => ({ meta: [{ title: withSiteName("Laporan Aset Tetap") }] }),
  component: Page,
});
