import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { TransferDetailScreen } from "@/features/keuangan/setoran/detail";

export const metadata: Metadata = {
  title: "Setoran",
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
        <TransferDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}
