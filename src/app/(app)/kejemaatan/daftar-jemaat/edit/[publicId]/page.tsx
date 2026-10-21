import type { Metadata } from "next";

import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat/form";

export const metadata: Metadata = {
  title: "Ubah Jemaat",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <JemaatFormScreen code={publicId} />;
}
