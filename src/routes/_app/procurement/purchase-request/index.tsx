import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  RequestListScreen,
  requestTable,
} from "@/features/pengadaan/permintaan-pembelian/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={requestTable(false)} />
        }
      >
        <RequestListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/purchase-request/")({
  head: () => ({ meta: [{ title: withSiteName("Purchase Request") }] }),
  component: Page,
});
