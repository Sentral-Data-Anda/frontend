import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { bapelTable, BapelListScreen } from "@/features/kejemaatan/bapel/list";

export const metadata: Metadata = {
  title: "Badan Pelayanan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={bapelTable(false)} />}>
        <BapelListScreen />
      </Suspense>
    </PageContainer>
  );
}
