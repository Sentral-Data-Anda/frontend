import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { JemaatFormScreen } from "@/features/kejemaatan/daftar-jemaat/form-screen";

export const metadata: Metadata = {
  title: "Tambah Jemaat",
};

export default function Page() {
  return (
    <PageContainer>
      <JemaatFormScreen />
    </PageContainer>
  );
}
