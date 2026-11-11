import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { RuangListScreen, ruangTable } from "@/features/fasilitas/ruang/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={ruangTable(false)} />}>
        <RuangListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fasilitas/ruang/")({
  head: () => ({ meta: [{ title: withSiteName("Ruang") }] }),
  component: Page,
});
