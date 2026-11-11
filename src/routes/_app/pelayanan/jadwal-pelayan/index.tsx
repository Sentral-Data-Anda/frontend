import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  JadwalPelayanListScreen,
  jadwalPelayanTable,
} from "@/features/pelayanan/jadwal-pelayan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={jadwalPelayanTable(false)} />
        }
      >
        <JadwalPelayanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/pelayanan/jadwal-pelayan/")({
  head: () => ({ meta: [{ title: withSiteName("Jadwal Pelayan") }] }),
  component: Page,
});
