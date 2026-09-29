import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { TransferDetailScreen } from "@/features/inventaris/siklus-aset/detail";

export const metadata: Metadata = {
  title: "Pindah Lokasi",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <TransferDetailScreen code={code} />
    </PageContainer>
  );
}
