import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { EventListScreen, eventTable } from "@/features/kegiatan/event/list";

export const metadata: Metadata = {
  title: "Event",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={eventTable(false)} />}>
        <EventListScreen />
      </Suspense>
    </PageContainer>
  );
}
