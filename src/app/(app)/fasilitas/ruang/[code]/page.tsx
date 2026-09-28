import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { RuangDetailScreen } from "@/features/fasilitas/ruang/detail";

export const metadata: Metadata = {
  title: "Ruang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <RuangDetailScreen code={code} />
    </PageContainer>
  );
}
