import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  TipeBarangListScreen,
  tipeBarangTable,
} from "@/features/inventaris/tipe-barang/list";

export const metadata: Metadata = {
  title: "Tipe Barang",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={tipeBarangTable(false)} />
        }
      >
        <TipeBarangListScreen />
      </Suspense>
    </PageContainer>
  );
}
