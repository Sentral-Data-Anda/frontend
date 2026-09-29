import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { BarangLabelScreen } from "@/features/inventaris/barang/label";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Cetak Label Barang",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <BarangLabelScreen siteUrl={publicEnv.NEXT_PUBLIC_SITE_URL} />
    </Suspense>
  );
}
