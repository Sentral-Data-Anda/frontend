import type { Metadata } from "next";

import { SetelanFormScreen } from "@/features/persetujuan/setelan-persetujuan/form";

export const metadata: Metadata = {
  title: "Ubah Alur Persetujuan",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SetelanFormScreen id={id} />;
}
