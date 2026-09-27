import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  HolidayListScreen,
  holidayTable,
} from "@/features/pengaturan/hari-libur/list";

export const metadata: Metadata = {
  title: "Hari Libur",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={holidayTable(false)} />}>
        <HolidayListScreen />
      </Suspense>
    </PageContainer>
  );
}
