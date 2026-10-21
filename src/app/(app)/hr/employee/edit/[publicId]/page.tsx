import type { Metadata } from "next";

import { KaryawanFormScreen } from "@/features/sdm/karyawan/form";

export const metadata: Metadata = {
  title: "Ubah Employee",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <KaryawanFormScreen code={publicId} />;
}
