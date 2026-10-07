import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  JadwalPelayanListScreen,
  jadwalPelayanTable,
} from "@/features/pelayanan/jadwal-pelayan/list";

export const metadata: Metadata = {
  title: "Jadwal Pelayan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense
        fallback={
          <LoadingDataList shape="trailing" table={jadwalPelayanTable(false)} />
        }
      >
        <JadwalPelayanListScreen />
      </Suspense>
    </PageContainer>
  );
}
