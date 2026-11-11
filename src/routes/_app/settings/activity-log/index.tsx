import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  activityLogTable,
  ActivityLogListScreen,
} from "@/features/pengaturan/activity-log/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={activityLogTable} />}
      >
        <ActivityLogListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/settings/activity-log/")({
  head: () => ({ meta: [{ title: withSiteName("Activity Log") }] }),
  component: Page,
});
