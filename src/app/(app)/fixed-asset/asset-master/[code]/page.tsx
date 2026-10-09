import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { BarangDetailScreen } from "@/features/inventaris/barang/detail";

export const metadata: Metadata = {
  title: "Barang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <BarangDetailScreen code={code} />
    </PageContainer>
  );
}
