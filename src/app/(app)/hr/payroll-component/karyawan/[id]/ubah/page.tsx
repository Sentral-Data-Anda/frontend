import type { Metadata } from "next";

import { PenetapanFormScreen } from "@/features/sdm/komponen-payroll/form";

export const metadata: Metadata = {
  title: "Ubah Penetapan Komponen",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PenetapanFormScreen publicId={id} />;
}
