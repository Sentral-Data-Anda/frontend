import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  ReturnListScreen,
  returnTable,
} from "@/features/pengadaan/retur-pembelian/list";

export const metadata: Metadata = {
  title: "Purchase Return",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={returnTable(false)} />
        }
      >
        <ReturnListScreen />
      </Suspense>
    </PageContainer>
  );
}
