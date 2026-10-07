import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  ReceiptListScreen,
  receiptTable,
} from "@/features/pengadaan/penerimaan-barang/list";

export const metadata: Metadata = {
  title: "Penerimaan Barang",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="plain" table={receiptTable()} />}
      >
        <ReceiptListScreen />
      </Suspense>
    </PageContainer>
  );
}
