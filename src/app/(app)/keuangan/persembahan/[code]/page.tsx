import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PersembahanDetailScreen } from "@/features/keuangan/persembahan/detail";

export const metadata: Metadata = {
  title: "Persembahan",
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
        <PersembahanDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}
