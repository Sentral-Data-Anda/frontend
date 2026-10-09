import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { JournalDetailScreen } from "@/features/keuangan/jurnal/detail";

export const metadata: Metadata = {
  title: "Jurnal",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <JournalDetailScreen publicId={id} />
    </PageContainer>
  );
}
