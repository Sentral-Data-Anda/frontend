import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { OpnameDetailScreen } from "@/features/inventaris/stok-opname/detail";

export const metadata: Metadata = {
  title: "Stok Opname",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <OpnameDetailScreen code={code} />
    </PageContainer>
  );
}
