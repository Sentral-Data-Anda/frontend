import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  AllocationListScreen,
  allocationTable,
} from "@/features/anggaran/pagu-anggaran/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={allocationTable()} />
        }
      >
        <AllocationListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/budgeting/budget/")({
  head: () => ({ meta: [{ title: withSiteName("Budget") }] }),
  component: Page,
});
