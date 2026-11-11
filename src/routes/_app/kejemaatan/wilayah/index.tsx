import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  WilayahListScreen,
  wilayahTable,
} from "@/features/kejemaatan/wilayah/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={wilayahTable(false)} />
        }
      >
        <WilayahListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kejemaatan/wilayah/")({
  head: () => ({ meta: [{ title: withSiteName("Wilayah") }] }),
  component: Page,
});
