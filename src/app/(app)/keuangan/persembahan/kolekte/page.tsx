import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { KolekteScreen } from "@/features/keuangan/persembahan/form";

export const metadata: Metadata = {
  title: "Catat Kolekte",
};

export default function Page() {
  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <KolekteScreen />
      </Suspense>
    </PageContainer>
  );
}
