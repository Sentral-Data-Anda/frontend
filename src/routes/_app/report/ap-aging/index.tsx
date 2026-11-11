import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { LaporanUtangScreen } from "@/features/pengadaan/laporan-utang";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <LaporanUtangScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/report/ap-aging/")({
  head: () => ({ meta: [{ title: withSiteName("Umur Utang Supplier") }] }),
  component: Page,
});
