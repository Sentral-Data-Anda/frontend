import type { Metadata } from "next";

import { DaftarPelayanFormScreen } from "@/features/pelayanan/daftar-pelayan/form";

export const metadata: Metadata = {
  title: "Ubah Pelayan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <DaftarPelayanFormScreen code={publicId} />;
}
