import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { ReportFormScreen } from "@/features/anggaran/laporan-budget/form";

export const metadata: Metadata = {
  title: "Ubah Budget Realization",
};

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <Suspense fallback={<LoadingGlobal />}>
      <ReportFormScreen publicId={publicId} />
    </Suspense>
  );
}
