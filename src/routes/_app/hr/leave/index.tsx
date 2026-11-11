import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { CutiListScreen, cutiTable } from "@/features/sdm/cuti/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={cutiTable()} />}
      >
        <CutiListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/leave/")({
  head: () => ({ meta: [{ title: withSiteName("Leave") }] }),
  component: Page,
});
