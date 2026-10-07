import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  TipeIbadahListScreen,
  tipeIbadahTable,
} from "@/features/peribadahan/tipe-ibadah/list";

export const metadata: Metadata = {
  title: "Tipe Ibadah",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={tipeIbadahTable(false)} />
        }
      >
        <TipeIbadahListScreen />
      </Suspense>
    </PageContainer>
  );
}
