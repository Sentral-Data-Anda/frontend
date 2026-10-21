import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PageContainer } from "@/components/layout";
import { PinjamanFormScreen } from "@/features/keuangan/pinjaman";

export const metadata: Metadata = {
  title: "Ubah Pinjaman",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PinjamanFormScreen publicId={publicId} />
      </Suspense>
    </PageContainer>
  );
}
