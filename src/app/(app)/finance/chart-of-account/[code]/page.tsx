import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { AccountDetailScreen } from "@/features/keuangan/akun/detail";

export const metadata: Metadata = {
  title: "Akun",
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
        <AccountDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}
