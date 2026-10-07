import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  SatuanListScreen,
  satuanTable,
} from "@/features/inventaris/satuan/list";

export const metadata: Metadata = {
  title: "Satuan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={satuanTable(false)} />
        }
      >
        <SatuanListScreen />
      </Suspense>
    </PageContainer>
  );
}
