import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PaymentDetailScreen } from "@/features/keuangan/pembayaran/detail";

export const metadata: Metadata = {
  title: "Pembayaran",
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
        <PaymentDetailScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
