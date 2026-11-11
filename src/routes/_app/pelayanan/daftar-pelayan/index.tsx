import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  DaftarPelayanListScreen,
  daftarPelayanTable,
} from "@/features/pelayanan/daftar-pelayan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList table={daftarPelayanTable(false)} />}
      >
        <DaftarPelayanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/pelayanan/daftar-pelayan/")({
  head: () => ({ meta: [{ title: withSiteName("Daftar Pelayan") }] }),
  component: Page,
});
