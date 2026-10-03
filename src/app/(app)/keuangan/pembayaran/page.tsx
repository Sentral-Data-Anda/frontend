import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PaymentListScreen,
  paymentTable,
} from "@/features/keuangan/pembayaran/list";

export const metadata: Metadata = {
  title: "Pembayaran",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={paymentTable()} />}>
        <PaymentListScreen />
      </Suspense>
    </PageContainer>
  );
}
