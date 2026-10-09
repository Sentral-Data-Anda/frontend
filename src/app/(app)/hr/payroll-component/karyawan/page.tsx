import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  penetapanTable,
  PenetapanListScreen,
} from "@/features/sdm/komponen-payroll/list";

export const metadata: Metadata = {
  title: "Penetapan Komponen",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList table={penetapanTable(false)} shape="trailing" />
        }
      >
        <PenetapanListScreen />
      </Suspense>
    </PageContainer>
  );
}
