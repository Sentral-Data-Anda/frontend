import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  RequestListScreen,
  requestTable,
} from "@/features/pengadaan/permintaan-pembelian/list";

export const metadata: Metadata = {
  title: "Permintaan Pembelian",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={requestTable(false)} />
        }
      >
        <RequestListScreen />
      </Suspense>
    </PageContainer>
  );
}
