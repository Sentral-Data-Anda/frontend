import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  ReceiptListScreen,
  receiptTable,
} from "@/features/keuangan/kas-masuk/list";

export const metadata: Metadata = {
  title: "Kas Masuk",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={receiptTable(false)} />}>
        <ReceiptListScreen />
      </Suspense>
    </PageContainer>
  );
}
