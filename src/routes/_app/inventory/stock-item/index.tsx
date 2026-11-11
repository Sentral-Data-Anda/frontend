import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  StockListScreen,
  persediaanTable,
} from "@/features/inventaris/barang-persediaan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={persediaanTable(false)} />
        }
      >
        <StockListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/stock-item/")({
  head: () => ({ meta: [{ title: withSiteName("Stock Item") }] }),
  component: Page,
});
