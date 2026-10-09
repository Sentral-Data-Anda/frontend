import type { Metadata } from "next";

import { ProgramFormScreen } from "@/features/anggaran/program/form";

export const metadata: Metadata = {
  title: "Ubah Program",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProgramFormScreen publicId={id} />;
}
