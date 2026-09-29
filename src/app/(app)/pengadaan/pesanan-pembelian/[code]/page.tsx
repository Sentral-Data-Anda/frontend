import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { OrderDetailScreen } from "@/features/pengadaan/pesanan-pembelian/detail";

export const metadata: Metadata = {
  title: "Pesanan Pembelian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <OrderDetailScreen code={code} />
    </PageContainer>
  );
}
