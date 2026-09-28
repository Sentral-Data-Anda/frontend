import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PenyusutanListScreen,
  penyusutanTable,
} from "@/features/inventaris/penyusutan/list";

export const metadata: Metadata = {
  title: "Penyusutan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={penyusutanTable()} />}>
        <PenyusutanListScreen />
      </Suspense>
    </PageContainer>
  );
}
