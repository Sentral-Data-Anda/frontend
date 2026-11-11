import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { GaleriListScreen, galeriTable } from "@/features/kegiatan/galeri/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={galeriTable(false)} />}>
        <GaleriListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kegiatan/galeri/")({
  head: () => ({ meta: [{ title: withSiteName("Galeri") }] }),
  component: Page,
});
