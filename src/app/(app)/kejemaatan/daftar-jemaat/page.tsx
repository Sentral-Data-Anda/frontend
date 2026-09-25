import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list/loading-list";
import { PageContainer } from "@/components/layout/page-container";
import { jemaatTable } from "@/features/kejemaatan/daftar-jemaat/list/list-item";
import { JemaatListScreen } from "@/features/kejemaatan/daftar-jemaat/list/screen";

export const metadata: Metadata = {
  title: "Daftar Jemaat",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={jemaatTable(false)} />}>
        <JemaatListScreen />
      </Suspense>
    </PageContainer>
  );
}
