import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { LaporanAsetScreen } from "@/features/inventaris/laporan-aset";

export const metadata: Metadata = {
  title: "Laporan Aset Tetap",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <LaporanAsetScreen />
      </Suspense>
    </PageContainer>
  );
}
