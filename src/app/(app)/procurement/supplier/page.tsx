import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  SupplierListScreen,
  supplierTable,
} from "@/features/pengadaan/supplier/list";

export const metadata: Metadata = {
  title: "Supplier",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={supplierTable(false)} />
        }
      >
        <SupplierListScreen />
      </Suspense>
    </PageContainer>
  );
}
