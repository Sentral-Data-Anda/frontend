import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { CutiDetailScreen } from "@/features/sdm/cuti/detail";

export const metadata: Metadata = {
  title: "Cuti",
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
        <CutiDetailScreen code={code} />
      </Suspense>
    </PageContainer>
  );
}
