import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { ReceiptDetailScreen } from "@/features/pengadaan/penerimaan-barang/detail";

export const metadata: Metadata = {
  title: "Penerimaan Barang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <ReceiptDetailScreen code={code} />
    </PageContainer>
  );
}
