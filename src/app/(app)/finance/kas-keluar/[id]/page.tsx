import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { ExpenseDetailScreen } from "@/features/keuangan/kas-keluar/detail";

export const metadata: Metadata = {
  title: "Kas Keluar",
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
        <ExpenseDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
