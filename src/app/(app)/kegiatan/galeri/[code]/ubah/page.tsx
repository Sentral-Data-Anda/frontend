import type { Metadata } from "next";

import { GaleriFormScreen } from "@/features/kegiatan/galeri/form";

export const metadata: Metadata = {
  title: "Ubah Album",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <GaleriFormScreen code={code} />;
}
