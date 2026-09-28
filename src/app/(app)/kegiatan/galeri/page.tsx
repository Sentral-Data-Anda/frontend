import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { GaleriListScreen, galeriTable } from "@/features/kegiatan/galeri/list";

export const metadata: Metadata = {
  title: "Galeri",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={galeriTable(false)} />}>
        <GaleriListScreen />
      </Suspense>
    </PageContainer>
  );
}
