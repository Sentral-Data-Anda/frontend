import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { StockDetailScreen } from "@/features/inventaris/barang-persediaan/detail";

export const metadata: Metadata = {
  title: "Barang Persediaan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <StockDetailScreen code={code} />
    </PageContainer>
  );
}
