import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  OpnameListScreen,
  opnameTable,
} from "@/features/inventaris/stok-opname/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={opnameTable(false)} />
        }
      >
        <OpnameListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/inventory/stok-opname/")({
  head: () => ({ meta: [{ title: withSiteName("Stok Opname") }] }),
  component: Page,
});
