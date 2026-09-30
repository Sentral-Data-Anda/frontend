import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PersembahanFormScreen } from "@/features/keuangan/persembahan/form";

export const metadata: Metadata = {
  title: "Catat Persembahan",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PersembahanFormScreen />
      </Suspense>
    </PageContainer>
  );
}
