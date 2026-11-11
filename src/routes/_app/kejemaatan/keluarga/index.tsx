import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  keluargaTable,
  KeluargaListScreen,
} from "@/features/kejemaatan/keluarga/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={keluargaTable(false)} />
        }
      >
        <KeluargaListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kejemaatan/keluarga/")({
  head: () => ({ meta: [{ title: withSiteName("Keluarga") }] }),
  component: Page,
});
