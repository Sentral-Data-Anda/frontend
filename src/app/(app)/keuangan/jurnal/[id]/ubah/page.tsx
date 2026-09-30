import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { JournalFormScreen } from "@/features/keuangan/jurnal/form";

export const metadata: Metadata = {
  title: "Ubah Entri Jurnal",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <JournalFormScreen publicId={id} />
    </Suspense>
  );
}
