import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  SetelanListScreen,
  setelanTable,
} from "@/features/persetujuan/setelan-persetujuan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={setelanTable(false)} />
        }
      >
        <SetelanListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/approval/approval-workflow/")({
  head: () => ({ meta: [{ title: withSiteName("Approval Workflow") }] }),
  component: Page,
});
