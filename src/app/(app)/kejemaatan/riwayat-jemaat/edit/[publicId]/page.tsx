import type { Metadata } from "next";

import { RiwayatFormScreen } from "@/features/kejemaatan/riwayat-jemaat/form";

export const metadata: Metadata = {
  title: "Ubah Riwayat Jemaat",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <RiwayatFormScreen id={publicId} />;
}
