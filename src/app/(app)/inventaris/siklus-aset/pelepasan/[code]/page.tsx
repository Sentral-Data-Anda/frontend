import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { DisposalDetailScreen } from "@/features/inventaris/siklus-aset/detail";

export const metadata: Metadata = {
  title: "Pelepasan Barang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <DisposalDetailScreen code={code} />
    </PageContainer>
  );
}
