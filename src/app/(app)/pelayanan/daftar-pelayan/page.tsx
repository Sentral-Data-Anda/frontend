import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  DaftarPelayanListScreen,
  daftarPelayanTable,
} from "@/features/pelayanan/daftar-pelayan/list";

export const metadata: Metadata = {
  title: "Daftar Pelayan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList table={daftarPelayanTable(false)} />}
      >
        <DaftarPelayanListScreen />
      </Suspense>
    </PageContainer>
  );
}
