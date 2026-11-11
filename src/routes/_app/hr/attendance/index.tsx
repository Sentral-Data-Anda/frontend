import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  AbsensiListScreen,
  absensiTable,
} from "@/features/sdm/absensi-karyawan/list";

function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={absensiTable(false)} />
        }
      >
        <AbsensiListScreen />
      </Suspense>
    </PageContainer>
  );
}

export const Route = createFileRoute("/_app/hr/attendance/")({
  head: () => ({ meta: [{ title: withSiteName("Attendance") }] }),
  component: Page,
});
