import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  AbsensiListScreen,
  absensiTable,
} from "@/features/sdm/absensi-karyawan/list";

export const metadata: Metadata = {
  title: "Absensi Karyawan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={absensiTable(false)} />}>
        <AbsensiListScreen />
      </Suspense>
    </PageContainer>
  );
}
