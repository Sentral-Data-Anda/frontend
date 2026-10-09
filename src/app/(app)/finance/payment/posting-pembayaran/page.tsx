import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PostingPembayaranScreen } from "@/features/keuangan/pembayaran/posting";

export const metadata: Metadata = {
  title: "Posting Pembayaran Event",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPembayaranScreen />
    </Suspense>
  );
}
