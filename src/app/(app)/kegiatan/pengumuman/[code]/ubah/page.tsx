import type { Metadata } from "next";

import { PengumumanFormScreen } from "@/features/kegiatan/pengumuman/form";

export const metadata: Metadata = {
  title: "Ubah Pengumuman",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <PengumumanFormScreen code={code} />;
}
