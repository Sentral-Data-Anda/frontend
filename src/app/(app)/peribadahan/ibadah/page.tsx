import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  IbadahListScreen,
  ibadahTable,
} from "@/features/peribadahan/ibadah/list";

export const metadata: Metadata = {
  title: "Ibadah",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={ibadahTable(false)} />
        }
      >
        <IbadahListScreen />
      </Suspense>
    </PageContainer>
  );
}
