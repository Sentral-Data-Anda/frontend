import type { Metadata } from "next";

import { PengumumanFormScreen } from "@/features/kegiatan/pengumuman/form";

export const metadata: Metadata = {
  title: "Ubah Pengumuman",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <PengumumanFormScreen code={publicId} />;
}
