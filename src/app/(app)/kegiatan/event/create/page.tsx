import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingGlobal } from "@/components/common/feedback";
import { EventFormScreen } from "@/features/kegiatan/event/form";

export const metadata: Metadata = {
  title: "Tambah Event",
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingGlobal />}>
      <EventFormScreen />
    </Suspense>
  );
}
