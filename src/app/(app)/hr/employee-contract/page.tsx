import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  KontrakListScreen,
  kontrakTable,
} from "@/features/sdm/kontrak-karyawan/list";

export const metadata: Metadata = {
  title: "Kontrak Karyawan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList table={kontrakTable(false)} shape="trailing" />
        }
      >
        <KontrakListScreen />
      </Suspense>
    </PageContainer>
  );
}
