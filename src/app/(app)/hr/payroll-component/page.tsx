import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  katalogTable,
  KatalogListScreen,
} from "@/features/sdm/komponen-payroll/list";

export const metadata: Metadata = {
  title: "Komponen Payroll",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList table={katalogTable(false)} shape="trailing" />
        }
      >
        <KatalogListScreen />
      </Suspense>
    </PageContainer>
  );
}
