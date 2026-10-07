import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  OpnameListScreen,
  opnameTable,
} from "@/features/inventaris/stok-opname/list";

export const metadata: Metadata = {
  title: "Stok Opname",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={opnameTable(false)} />
        }
      >
        <OpnameListScreen />
      </Suspense>
    </PageContainer>
  );
}
