import type { Metadata } from "next";

import { PageContainer } from "@/components/layout";
import { ActivityLogDetailScreen } from "@/features/pengaturan/activity-log/list";

export const metadata: Metadata = {
  title: "Detail Log Aktivitas",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <ActivityLogDetailScreen id={id} />
    </PageContainer>
  );
}
