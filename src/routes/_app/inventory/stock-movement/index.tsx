import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  MutasiListScreen,
  mutasiTable,
} from "@/features/inventaris/mutasi-stok/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={mutasiTable()} />}
      >
        <MutasiListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/stock-movement/")({
  head: () => ({ meta: [{ title: withSiteName("Stock Movement") }] }),
  component: Page,
});
