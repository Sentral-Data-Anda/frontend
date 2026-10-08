import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PostingAsetScreen } from "@/features/keuangan/jurnal/posting";

export const metadata: Metadata = {
  title: "Posting Aset Sumbangan",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingAsetScreen />
    </Suspense>
  );
}
