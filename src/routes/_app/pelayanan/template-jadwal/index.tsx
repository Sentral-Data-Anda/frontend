import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  TemplateJadwalListScreen,
  templateJadwalTable,
} from "@/features/pelayanan/template-jadwal/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList
            shape="trailing"
            table={templateJadwalTable(false)}
          />
        }
      >
        <TemplateJadwalListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/pelayanan/template-jadwal/")({
  head: () => ({ meta: [{ title: withSiteName("Template Jadwal") }] }),
  component: Page,
});
