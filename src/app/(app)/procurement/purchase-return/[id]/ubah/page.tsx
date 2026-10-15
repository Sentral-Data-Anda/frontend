import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReturnFormScreen } from "@/features/pengadaan/retur-pembelian/form";

export const metadata: Metadata = {
  title: "Ubah Retur Pembelian",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReturnFormScreen publicId={id} />
    </Suspense>
  );
}
