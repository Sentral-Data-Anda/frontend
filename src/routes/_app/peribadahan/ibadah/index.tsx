import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  IbadahListScreen,
  ibadahTable,
} from "@/features/peribadahan/ibadah/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={ibadahTable(false)} />
        }
      >
        <IbadahListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/peribadahan/ibadah/")({
  head: () => ({ meta: [{ title: withSiteName("Ibadah") }] }),
  component: Page,
});
