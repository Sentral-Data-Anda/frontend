import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PayslipScreen } from "@/features/sdm/payroll/detail";

// Nol nama dan nol nominal di judul tab (SDM §0.3 no. 5).
export const metadata: Metadata = {
  title: "Penggajian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string; slip: string }>;
}) {
  const { code, slip } = await params;

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PayslipScreen code={code} slipCode={slip} />
      </Suspense>
    </PageContainer>
  );
}
