import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  KaryawanListScreen,
  karyawanTable,
} from "@/features/sdm/karyawan/list";

export const metadata: Metadata = {
  title: "Karyawan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={karyawanTable(false)} />}>
        <KaryawanListScreen />
      </Suspense>
    </PageContainer>
  );
}
