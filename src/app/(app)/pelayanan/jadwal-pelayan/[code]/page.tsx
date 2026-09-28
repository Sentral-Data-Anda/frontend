import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { JadwalPelayanDetailScreen } from "@/features/pelayanan/jadwal-pelayan/detail";

export const metadata: Metadata = {
  title: "Jadwal Pelayan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <PageContainer size="full">
      <JadwalPelayanDetailScreen code={code} />
    </PageContainer>
  );
}
