import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  OfferingTypeListScreen,
  offeringTypeTable,
} from "@/features/keuangan/tipe-persembahan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={offeringTypeTable(false)} />
        }
      >
        <OfferingTypeListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/tipe-persembahan/")({
  head: () => ({ meta: [{ title: withSiteName("Tipe Persembahan") }] }),
  component: Page,
});
