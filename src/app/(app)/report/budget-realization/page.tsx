import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  ReportListScreen,
  reportTable,
} from "@/features/anggaran/laporan-budget/list";

export const metadata: Metadata = {
  title: "Laporan Budget",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={reportTable()} />}
      >
        <ReportListScreen />
      </Suspense>
    </PageContainer>
  );
}
