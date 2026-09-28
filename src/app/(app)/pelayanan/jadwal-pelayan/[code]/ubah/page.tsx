import type { Metadata } from "next";

import { JadwalPelayanFormScreen } from "@/features/pelayanan/jadwal-pelayan/form";

export const metadata: Metadata = {
  title: "Ubah Jadwal Pelayan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <JadwalPelayanFormScreen code={code} />;
}
