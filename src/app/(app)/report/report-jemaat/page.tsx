import type { Metadata } from "next";
import { Suspense } from "react";

import { PageContainer } from "@/components/layout";
import { ReportJemaatScreen } from "@/features/kejemaatan/report-jemaat";

export const metadata: Metadata = {
  title: "Laporan Jemaat",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense>
        <ReportJemaatScreen />
      </Suspense>
    </PageContainer>
  );
}
