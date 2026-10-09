import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PostingPersediaanScreen } from "@/features/keuangan/jurnal/posting";

export const metadata: Metadata = { title: "Posting Mutasi Persediaan" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPersediaanScreen />
    </Suspense>
  );
}
