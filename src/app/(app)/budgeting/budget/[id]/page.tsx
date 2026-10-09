import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { AllocationDetailScreen } from "@/features/anggaran/pagu-anggaran/detail";

export const metadata: Metadata = {
  title: "Pagu Anggaran",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <AllocationDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
