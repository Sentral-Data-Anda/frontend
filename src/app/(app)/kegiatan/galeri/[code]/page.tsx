import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { GaleriDetailScreen } from "@/features/kegiatan/galeri/detail";

export const metadata: Metadata = {
  title: "Galeri",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <GaleriDetailScreen code={code} />
    </PageContainer>
  );
}
