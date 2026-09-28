import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { PenyusutanDetailScreen } from "@/features/inventaris/penyusutan/detail";

export const metadata: Metadata = {
  title: "Penyusutan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <PenyusutanDetailScreen code={code} />
    </PageContainer>
  );
}
