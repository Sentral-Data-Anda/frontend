import type { Metadata } from "next";

import { RiwayatFormScreen } from "@/features/kejemaatan/riwayat-jemaat/form";

export const metadata: Metadata = {
  title: "Ubah Riwayat Jemaat",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <RiwayatFormScreen id={id} />;
}
