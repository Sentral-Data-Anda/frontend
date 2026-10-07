import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  TransferListScreen,
  transferTable,
} from "@/features/keuangan/setoran/list";

export const metadata: Metadata = {
  title: "Setoran",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={transferTable()} />}
      >
        <TransferListScreen />
      </Suspense>
    </PageContainer>
  );
}
