import type { Metadata } from "next";

import { StockFormScreen } from "@/features/inventaris/barang-persediaan/form";

export const metadata: Metadata = {
  title: "Ubah Stock Item",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <StockFormScreen code={code} />;
}
