import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReturnFormScreen } from "@/features/pengadaan/retur-pembelian/form";

export const metadata: Metadata = {
  title: "Ubah Purchase Return",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReturnFormScreen publicId={publicId} />
    </Suspense>
  );
}
