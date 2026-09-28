import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  LoanListScreen,
  peminjamanTable,
} from "@/features/fasilitas/peminjaman-ruang/list";

export const metadata: Metadata = {
  title: "Peminjaman Ruang",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={peminjamanTable(false)} />}>
        <LoanListScreen />
      </Suspense>
    </PageContainer>
  );
}
