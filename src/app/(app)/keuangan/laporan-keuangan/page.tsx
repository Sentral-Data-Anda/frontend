import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { LaporanKeuanganScreen } from "@/features/keuangan/laporan-keuangan";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList />}>
        <LaporanKeuanganScreen />
      </Suspense>
    </PageContainer>
  );
}
