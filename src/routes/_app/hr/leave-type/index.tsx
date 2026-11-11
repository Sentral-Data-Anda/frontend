import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  TipeCutiListScreen,
  tipeCutiTable,
} from "@/features/sdm/tipe-cuti/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={tipeCutiTable(false)} />
        }
      >
        <TipeCutiListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/leave-type/")({
  head: () => ({ meta: [{ title: withSiteName("Leave Type") }] }),
  component: Page,
});
