import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  PendaftaranListScreen,
  pendaftaranTable,
} from "@/features/kegiatan/pendaftaran-event/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={pendaftaranTable()} />}>
        <PendaftaranListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kegiatan/pendaftaran-event/")({
  head: () => ({ meta: [{ title: withSiteName("Pendaftaran Event") }] }),
  component: Page,
});
