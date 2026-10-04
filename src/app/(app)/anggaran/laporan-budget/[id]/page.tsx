import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { ReportDetailScreen } from "@/features/anggaran/laporan-budget/detail";

export const metadata: Metadata = {
  title: "Laporan Budget",
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
        <ReportDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
