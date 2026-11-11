import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  katalogTable,
  KatalogListScreen,
} from "@/features/sdm/komponen-payroll/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList table={katalogTable(false)} shape="trailing" />
        }
      >
        <KatalogListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/payroll-component/")({
  head: () => ({ meta: [{ title: withSiteName("Payroll Component") }] }),
  component: Page,
});
