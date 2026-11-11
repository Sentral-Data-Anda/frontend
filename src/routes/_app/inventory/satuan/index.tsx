import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  SatuanListScreen,
  satuanTable,
} from "@/features/inventaris/satuan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={satuanTable(false)} />
        }
      >
        <SatuanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/satuan/")({
  head: () => ({ meta: [{ title: withSiteName("Satuan") }] }),
  component: Page,
});
