import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReceiptFormScreen } from "@/features/keuangan/kas-masuk/form";

export const metadata: Metadata = {
  title: "Ubah Kas Masuk",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReceiptFormScreen publicId={publicId} />
    </Suspense>
  );
}
