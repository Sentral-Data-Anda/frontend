import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { ProgramDetailScreen } from "@/features/anggaran/program/detail";

export const metadata: Metadata = {
  title: "Program",
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
        <ProgramDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
