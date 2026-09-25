import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  jemaatTable,
  JemaatListScreen,
} from "@/features/kejemaatan/daftar-jemaat/list";

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
