import type { Metadata } from "next";

import { PenetapanFormScreen } from "@/features/sdm/komponen-payroll/form";

export const metadata: Metadata = {
  title: "Ubah Penetapan Komponen",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <PenetapanFormScreen publicId={publicId} />;
}
