import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  riwayatTable,
  RiwayatListScreen,
} from "@/features/kejemaatan/riwayat-jemaat/list";

export const metadata: Metadata = {
  title: "Riwayat Jemaat",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={riwayatTable(false)} />}>
        <RiwayatListScreen />
      </Suspense>
    </PageContainer>
  );
}
