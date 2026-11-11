import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  KaryawanListScreen,
  karyawanTable,
} from "@/features/sdm/karyawan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={karyawanTable(false)} />}>
        <KaryawanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/employee/")({
  head: () => ({ meta: [{ title: withSiteName("Employee") }] }),
  component: Page,
});
