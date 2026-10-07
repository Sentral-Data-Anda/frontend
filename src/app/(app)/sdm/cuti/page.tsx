import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { CutiListScreen, cutiTable } from "@/features/sdm/cuti/list";

export const metadata: Metadata = {
  title: "Cuti",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={cutiTable()} />}
      >
        <CutiListScreen />
      </Suspense>
    </PageContainer>
  );
}
