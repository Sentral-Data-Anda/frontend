import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  StockListScreen,
  persediaanTable,
} from "@/features/inventaris/barang-persediaan/list";

export const metadata: Metadata = {
  title: "Barang Persediaan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={persediaanTable(false)} />
        }
      >
        <StockListScreen />
      </Suspense>
    </PageContainer>
  );
}
