import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  HolidayListScreen,
  holidayTable,
} from "@/features/pengaturan/hari-libur/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={holidayTable(false)} />
        }
      >
        <HolidayListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/settings/holiday/")({
  head: () => ({ meta: [{ title: withSiteName("Holiday") }] }),
  component: Page,
});
