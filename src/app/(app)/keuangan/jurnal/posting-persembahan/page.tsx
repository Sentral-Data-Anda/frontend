import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { PostingPersembahanScreen } from "@/features/keuangan/jurnal/form";

export const metadata: Metadata = {
  title: "Posting Persembahan",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <PostingPersembahanScreen />
    </Suspense>
  );
}
