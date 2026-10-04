import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  AllocationListScreen,
  allocationTable,
} from "@/features/anggaran/pagu-anggaran/list";

export const metadata: Metadata = {
  title: "Pagu Anggaran",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={allocationTable()} />}>
        <AllocationListScreen />
      </Suspense>
    </PageContainer>
  );
}
