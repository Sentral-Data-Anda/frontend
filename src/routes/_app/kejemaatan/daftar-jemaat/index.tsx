import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  jemaatTable,
  JemaatListScreen,
} from "@/features/kejemaatan/daftar-jemaat/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={jemaatTable(false)} />}>
        <JemaatListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kejemaatan/daftar-jemaat/")({
  head: () => ({ meta: [{ title: withSiteName("Daftar Jemaat") }] }),
  component: Page,
});
