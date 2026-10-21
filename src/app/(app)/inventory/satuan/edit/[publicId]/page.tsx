import type { Metadata } from "next";

import { SatuanFormScreen } from "@/features/inventaris/satuan/form";

export const metadata: Metadata = {
  title: "Ubah Satuan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <SatuanFormScreen code={publicId} />;
}
