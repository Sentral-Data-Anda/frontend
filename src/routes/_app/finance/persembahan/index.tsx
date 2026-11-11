import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  PersembahanListScreen,
  persembahanTable,
} from "@/features/keuangan/persembahan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={persembahanTable(false)} />
        }
      >
        <PersembahanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/finance/persembahan/")({
  head: () => ({ meta: [{ title: withSiteName("Persembahan") }] }),
  component: Page,
});
