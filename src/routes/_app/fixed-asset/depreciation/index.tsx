import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  PenyusutanListScreen,
  penyusutanTable,
} from "@/features/inventaris/penyusutan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={penyusutanTable()} />
        }
      >
        <PenyusutanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fixed-asset/depreciation/")({
  head: () => ({ meta: [{ title: withSiteName("Depreciation") }] }),
  component: Page,
});
