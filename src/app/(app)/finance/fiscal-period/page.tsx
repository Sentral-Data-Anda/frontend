import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PeriodListScreen,
  periodTable,
} from "@/features/keuangan/periode-fiskal/list";

export const metadata: Metadata = {
  title: "Periode Fiskal",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={<LoadingDataList shape="trailing" table={periodTable()} />}
      >
        <PeriodListScreen />
      </Suspense>
    </PageContainer>
  );
}
