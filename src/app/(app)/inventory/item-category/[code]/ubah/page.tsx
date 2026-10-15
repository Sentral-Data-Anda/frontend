import type { Metadata } from "next";

import { TipeBarangFormScreen } from "@/features/inventaris/tipe-barang/form";

export const metadata: Metadata = {
  title: "Ubah Item Category",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <TipeBarangFormScreen code={code} />;
}
