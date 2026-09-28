import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { PendaftaranDetailScreen } from "@/features/kegiatan/pendaftaran-event/detail";

export const metadata: Metadata = {
  title: "Pendaftaran Event",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <PendaftaranDetailScreen code={code} />
    </PageContainer>
  );
}
