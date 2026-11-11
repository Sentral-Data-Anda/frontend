import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  LoanListScreen,
  peminjamanTable,
} from "@/features/fasilitas/peminjaman-ruang/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={peminjamanTable(false)} />
        }
      >
        <LoanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/fasilitas/peminjaman-ruang/")({
  head: () => ({ meta: [{ title: withSiteName("Peminjaman Ruang") }] }),
  component: Page,
});
