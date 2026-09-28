import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  BarangListScreen,
  barangTable,
} from "@/features/inventaris/barang/list";

export const metadata: Metadata = {
  title: "Barang",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={barangTable(false)} />}>
        <BarangListScreen />
      </Suspense>
    </PageContainer>
  );
}
