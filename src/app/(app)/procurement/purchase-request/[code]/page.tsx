import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { RequestDetailScreen } from "@/features/pengadaan/permintaan-pembelian/detail";

export const metadata: Metadata = {
  title: "Permintaan Pembelian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <RequestDetailScreen code={code} />
    </PageContainer>
  );
}
