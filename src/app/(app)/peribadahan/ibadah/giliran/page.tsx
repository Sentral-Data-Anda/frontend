import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { GiliranScreen } from "@/features/peribadahan/ibadah/form";

export const metadata: Metadata = {
  title: "Jadwal Giliran Tuan Rumah",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <GiliranScreen />
    </Suspense>
  );
}
