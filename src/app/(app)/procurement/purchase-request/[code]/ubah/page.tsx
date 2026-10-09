import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { RequestFormScreen } from "@/features/pengadaan/permintaan-pembelian/form";

export const metadata: Metadata = {
  title: "Ubah Permintaan Pembelian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <RequestFormScreen code={code} />
    </Suspense>
  );
}
