import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  ReturnListScreen,
  returnTable,
} from "@/features/pengadaan/retur-pembelian/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={returnTable(false)} />
        }
      >
        <ReturnListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/purchase-return/")({
  head: () => ({ meta: [{ title: withSiteName("Purchase Return") }] }),
  component: Page,
});
