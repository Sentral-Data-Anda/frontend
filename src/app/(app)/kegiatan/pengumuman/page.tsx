import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  PengumumanListScreen,
  pengumumanTable,
} from "@/features/kegiatan/pengumuman/list";

export const metadata: Metadata = {
  title: "Pengumuman",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={pengumumanTable(false)} />
        }
      >
        <PengumumanListScreen />
      </Suspense>
    </PageContainer>
  );
}
