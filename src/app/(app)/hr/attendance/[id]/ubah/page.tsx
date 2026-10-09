import type { Metadata } from "next";

import { AbsensiFormScreen } from "@/features/sdm/absensi-karyawan/form";

export const metadata: Metadata = {
  title: "Ubah Absensi Karyawan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AbsensiFormScreen publicId={id} />;
}
