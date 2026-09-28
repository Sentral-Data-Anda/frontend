import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  MutasiListScreen,
  mutasiTable,
} from "@/features/inventaris/mutasi-stok/list";

export const metadata: Metadata = {
  title: "Mutasi Stok",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={mutasiTable()} />}>
        <MutasiListScreen />
      </Suspense>
    </PageContainer>
  );
}
