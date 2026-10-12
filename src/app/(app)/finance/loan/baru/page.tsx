import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PinjamanFormScreen } from "@/features/keuangan/pinjaman";

export const metadata: Metadata = {
  title: "Tambah Pinjaman",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PinjamanFormScreen />
      </Suspense>
    </PageContainer>
  );
}
