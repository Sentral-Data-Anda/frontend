import type { Metadata } from "next";

import { StockFormScreen } from "@/features/inventaris/barang-persediaan/form";

export const metadata: Metadata = {
  title: "Ubah Stock Item",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <StockFormScreen code={publicId} />;
}
