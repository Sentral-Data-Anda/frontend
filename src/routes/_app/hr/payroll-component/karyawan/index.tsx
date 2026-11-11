import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  penetapanTable,
  PenetapanListScreen,
} from "@/features/sdm/komponen-payroll/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList table={penetapanTable(false)} shape="trailing" />
        }
      >
        <PenetapanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/payroll-component/karyawan/")({
  head: () => ({ meta: [{ title: withSiteName("Penetapan Komponen") }] }),
  component: Page,
});
