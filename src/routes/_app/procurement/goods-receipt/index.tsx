import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  ReceiptListScreen,
  receiptTable,
} from "@/features/pengadaan/penerimaan-barang/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="plain" table={receiptTable()} />}
      >
        <ReceiptListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/goods-receipt/")({
  head: () => ({ meta: [{ title: withSiteName("Goods Receipt") }] }),
  component: Page,
});
