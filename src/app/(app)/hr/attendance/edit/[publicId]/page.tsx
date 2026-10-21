import type { Metadata } from "next";

import { AbsensiFormScreen } from "@/features/sdm/absensi-karyawan/form";

export const metadata: Metadata = {
  title: "Ubah Attendance",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <AbsensiFormScreen publicId={publicId} />;
}
