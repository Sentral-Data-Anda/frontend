import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  OrderListScreen,
  orderTable,
} from "@/features/pengadaan/pesanan-pembelian/list";

export const metadata: Metadata = {
  title: "Pesanan Pembelian",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={orderTable(false)} />}>
        <OrderListScreen />
      </Suspense>
    </PageContainer>
  );
}
