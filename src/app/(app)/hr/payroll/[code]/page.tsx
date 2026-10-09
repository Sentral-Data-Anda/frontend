import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PayrollDetailScreen } from "@/features/sdm/payroll/detail";

export const metadata: Metadata = {
  title: "Penggajian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PayrollDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}
