import type { Metadata } from "next";

import { PermintaanRejectScreen } from "@/features/persetujuan/permintaan-persetujuan/form";

export const metadata: Metadata = {
  title: "Tolak Permintaan Persetujuan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PermintaanRejectScreen id={id} />;
}
