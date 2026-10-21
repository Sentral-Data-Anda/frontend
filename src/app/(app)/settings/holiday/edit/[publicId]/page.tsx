import type { Metadata } from "next";

import { HolidayFormScreen } from "@/features/pengaturan/hari-libur/form";

export const metadata: Metadata = {
  title: "Ubah Holiday",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <HolidayFormScreen id={publicId} />;
}
