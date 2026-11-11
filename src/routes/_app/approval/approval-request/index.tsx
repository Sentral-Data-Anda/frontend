import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  PermintaanListScreen,
  permintaanTable,
} from "@/features/persetujuan/permintaan-persetujuan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList
            shape="trailing"
            table={permintaanTable("menunggu")}
          />
        }
      >
        <PermintaanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/approval/approval-request/")({
  head: () => ({ meta: [{ title: withSiteName("Approval Request") }] }),
  component: Page,
});
