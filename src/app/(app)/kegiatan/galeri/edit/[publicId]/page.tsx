import type { Metadata } from "next";

import { GaleriFormScreen } from "@/features/kegiatan/galeri/form";

export const metadata: Metadata = {
  title: "Ubah Album",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <GaleriFormScreen code={publicId} />;
}
