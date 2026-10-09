import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { CurrencyDetailScreen } from "@/features/keuangan/mata-uang/detail";

export const metadata: Metadata = {
  title: "Mata Uang",
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
        <CurrencyDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}
