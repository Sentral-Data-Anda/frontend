import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  TipeBarangListScreen,
  tipeBarangTable,
} from "@/features/inventaris/tipe-barang/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={tipeBarangTable(false)} />
        }
      >
        <TipeBarangListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/item-category/")({
  head: () => ({ meta: [{ title: withSiteName("Item Category") }] }),
  component: Page,
});
