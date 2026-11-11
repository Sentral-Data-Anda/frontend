import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  OrderListScreen,
  orderTable,
} from "@/features/pengadaan/pesanan-pembelian/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={orderTable(false)} />
        }
      >
        <OrderListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/purchase-order/")({
  head: () => ({ meta: [{ title: withSiteName("Purchase Order") }] }),
  component: Page,
});
