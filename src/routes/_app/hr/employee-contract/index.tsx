import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  KontrakListScreen,
  kontrakTable,
} from "@/features/sdm/kontrak-karyawan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList table={kontrakTable(false)} shape="trailing" />
        }
      >
        <KontrakListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/employee-contract/")({
  head: () => ({ meta: [{ title: withSiteName("Employee Contract") }] }),
  component: Page,
});
