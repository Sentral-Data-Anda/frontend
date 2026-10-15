import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { ReturnDetailScreen } from "@/features/pengadaan/retur-pembelian/detail";

export const metadata: Metadata = {
  title: "Purchase Return",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <ReturnDetailScreen publicId={id} />
    </PageContainer>
  );
}
