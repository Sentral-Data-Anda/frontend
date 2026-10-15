import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { PermintaanDetailScreen } from "@/features/persetujuan/permintaan-persetujuan/detail";

export const metadata: Metadata = {
  title: "Detail Approval Request",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <PermintaanDetailScreen id={id} />
    </PageContainer>
  );
}
