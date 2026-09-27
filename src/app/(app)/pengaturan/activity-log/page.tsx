import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  activityLogTable,
  ActivityLogListScreen,
} from "@/features/pengaturan/activity-log/list";

export const metadata: Metadata = {
  title: "Log Aktivitas",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={activityLogTable} />}>
        <ActivityLogListScreen />
      </Suspense>
    </PageContainer>
  );
}
