import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { JournalFormScreen } from "@/features/keuangan/jurnal/form";

export const metadata: Metadata = {
  title: "Ubah Journal Entry",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JournalFormScreen publicId={publicId} />
    </Suspense>
  );
}
