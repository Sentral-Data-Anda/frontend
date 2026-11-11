import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { PinjamanListScreen } from "@/features/keuangan/pinjaman";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <PinjamanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/loan/")({
  head: () => ({ meta: [{ title: withSiteName("Pinjaman") }] }),
  component: Page,
});
