import type { Metadata } from "next";

import { EventFormScreen } from "@/features/kegiatan/event/form";

export const metadata: Metadata = {
  title: "Ubah Event",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return <EventFormScreen code={publicId} />;
}
