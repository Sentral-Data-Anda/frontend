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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PageContainer size="full">
      <Suspense fallback={<LoadingGlobal />}>
        <PinjamanFormScreen publicId={id} />
      </Suspense>
    </PageContainer>
  );
}
