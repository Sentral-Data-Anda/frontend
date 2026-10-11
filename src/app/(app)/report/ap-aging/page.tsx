import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { LaporanUtangScreen } from "@/features/pengadaan/laporan-utang";

export const metadata: Metadata = {
  title: "Umur Utang Supplier",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <LaporanUtangScreen />
      </Suspense>
    </PageContainer>
  );
}
