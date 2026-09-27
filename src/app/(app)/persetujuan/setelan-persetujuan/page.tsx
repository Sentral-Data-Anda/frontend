import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import {
  SetelanListScreen,
  setelanTable,
} from "@/features/persetujuan/setelan-persetujuan/list";

export const metadata: Metadata = {
  title: "Setelan Alur Persetujuan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList table={setelanTable(false)} />}>
        <SetelanListScreen />
      </Suspense>
    </PageContainer>
  );
}
