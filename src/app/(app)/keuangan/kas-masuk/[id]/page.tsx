import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { ReceiptDetailScreen } from "@/features/keuangan/kas-masuk/detail";

export const metadata: Metadata = {
  title: "Kas Masuk",
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
        <ReceiptDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
