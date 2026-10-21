import type { Metadata } from "next";

import { OpnameFormScreen } from "@/features/inventaris/stok-opname/form";

export const metadata: Metadata = {
  title: "Ubah Stok Opname",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <OpnameFormScreen code={publicId} />;
}
