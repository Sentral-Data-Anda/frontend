import type { Metadata } from "next";

import { BarangFormScreen } from "@/features/inventaris/barang/form";

export const metadata: Metadata = {
  title: "Ubah Barang",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <BarangFormScreen code={code} />;
}
