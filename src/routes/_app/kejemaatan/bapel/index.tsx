import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { bapelTable, BapelListScreen } from "@/features/kejemaatan/bapel/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={bapelTable(false)} />
        }
      >
        <BapelListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kejemaatan/bapel/")({
  head: () => ({ meta: [{ title: withSiteName("Badan Pelayanan") }] }),
  component: Page,
});
