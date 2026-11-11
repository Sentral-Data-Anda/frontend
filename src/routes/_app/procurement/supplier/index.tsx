import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  SupplierListScreen,
  supplierTable,
} from "@/features/pengadaan/supplier/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={supplierTable(false)} />
        }
      >
        <SupplierListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/procurement/supplier/")({
  head: () => ({ meta: [{ title: withSiteName("Supplier") }] }),
  component: Page,
});
