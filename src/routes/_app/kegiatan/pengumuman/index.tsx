import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  PengumumanListScreen,
  pengumumanTable,
} from "@/features/kegiatan/pengumuman/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={pengumumanTable(false)} />
        }
      >
        <PengumumanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kegiatan/pengumuman/")({
  head: () => ({ meta: [{ title: withSiteName("Pengumuman") }] }),
  component: Page,
});
