import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { SupplierDetailScreen } from "@/features/pengadaan/supplier/detail";

export const metadata: Metadata = {
  title: "Supplier",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <SupplierDetailScreen code={code} />
    </PageContainer>
  );
}
