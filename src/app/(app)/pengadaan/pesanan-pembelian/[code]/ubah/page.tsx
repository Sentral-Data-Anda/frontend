import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { OrderFormScreen } from "@/features/pengadaan/pesanan-pembelian/form";

export const metadata: Metadata = {
  title: "Ubah Pesanan Pembelian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <OrderFormScreen code={code} />
    </Suspense>
  );
}
