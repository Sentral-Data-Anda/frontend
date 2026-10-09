import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  TipeCutiListScreen,
  tipeCutiTable,
} from "@/features/sdm/tipe-cuti/list";

export const metadata: Metadata = {
  title: "Tipe Cuti",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={tipeCutiTable(false)} />
        }
      >
        <TipeCutiListScreen />
      </Suspense>
    </PageContainer>
  );
}
