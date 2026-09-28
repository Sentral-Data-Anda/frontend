import type { Metadata } from "next";

import { DaftarPelayanFormScreen } from "@/features/pelayanan/daftar-pelayan/form";

export const metadata: Metadata = {
  title: "Ubah Pelayan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <DaftarPelayanFormScreen code={code} />;
}
