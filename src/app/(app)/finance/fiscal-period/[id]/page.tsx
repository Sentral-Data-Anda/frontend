import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { PeriodDetailScreen } from "@/features/keuangan/periode-fiskal/detail";

export const metadata: Metadata = {
  title: "Periode Fiskal",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <PeriodDetailScreen id={id} />
    </PageContainer>
  );
}
