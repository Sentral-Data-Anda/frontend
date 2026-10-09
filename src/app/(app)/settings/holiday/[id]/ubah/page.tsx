import type { Metadata } from "next";

import { HolidayFormScreen } from "@/features/pengaturan/hari-libur/form";

export const metadata: Metadata = {
  title: "Ubah Hari Libur",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <HolidayFormScreen id={id} />;
}
