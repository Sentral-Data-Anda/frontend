import type { Metadata } from "next";

import { SetelanFormScreen } from "@/features/persetujuan/setelan-persetujuan/form";

export const metadata: Metadata = {
  title: "Ubah Alur Persetujuan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <SetelanFormScreen id={publicId} />;
}
