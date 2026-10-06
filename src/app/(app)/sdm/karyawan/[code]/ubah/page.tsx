import type { Metadata } from "next";

import { KaryawanFormScreen } from "@/features/sdm/karyawan/form";

export const metadata: Metadata = {
  title: "Ubah Karyawan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <KaryawanFormScreen code={code} />;
}
