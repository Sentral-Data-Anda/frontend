import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingDataList } from "@/components/common/list";
import { PageContainer } from "@/components/layout";
import { PinjamanListScreen } from "@/features/keuangan/pinjaman";

export const metadata: Metadata = {
  title: "Pinjaman",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingDataList shape="trailing" />}>
        <PinjamanListScreen />
      </Suspense>
    </PageContainer>
  );
}
