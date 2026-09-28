import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { RuangListScreen, ruangTable } from "@/features/fasilitas/ruang/list";

export const metadata: Metadata = {
  title: "Ruang",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={ruangTable(false)} />}>
        <RuangListScreen />
      </Suspense>
    </PageContainer>
  );
}
