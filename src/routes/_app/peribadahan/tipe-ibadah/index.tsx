import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  TipeIbadahListScreen,
  tipeIbadahTable,
} from "@/features/peribadahan/tipe-ibadah/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={tipeIbadahTable(false)} />
        }
      >
        <TipeIbadahListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/peribadahan/tipe-ibadah/")({
  head: () => ({ meta: [{ title: withSiteName("Tipe Ibadah") }] }),
  component: Page,
});
