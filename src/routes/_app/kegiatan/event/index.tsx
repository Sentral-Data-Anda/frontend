import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import { EventListScreen, eventTable } from "@/features/kegiatan/event/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={eventTable(false)} />}>
        <EventListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/kegiatan/event/")({
  head: () => ({ meta: [{ title: withSiteName("Event") }] }),
  component: Page,
});
