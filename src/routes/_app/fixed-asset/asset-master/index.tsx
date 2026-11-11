import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  BarangListScreen,
  barangTable,
} from "@/features/inventaris/barang/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={barangTable(false)} />}>
        <BarangListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fixed-asset/asset-master/")({
  head: () => ({ meta: [{ title: withSiteName("Asset Master") }] }),
  component: Page,
});
