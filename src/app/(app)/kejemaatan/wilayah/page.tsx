import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  WilayahListScreen,
  wilayahTable,
} from "@/features/kejemaatan/wilayah/list";

export const metadata: Metadata = {
  title: "Wilayah",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={wilayahTable(false)} />
        }
      >
        <WilayahListScreen />
      </Suspense>
    </PageContainer>
  );
}
