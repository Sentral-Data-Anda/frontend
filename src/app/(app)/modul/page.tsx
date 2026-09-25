import { PageContainer } from "@/components/layout/page-container";
import { PencarianScreen } from "@/features/pencarian/screen";

export const metadata = { title: "Pencarian" };

export default function Page() {
  return (
    <PageContainer>
      <PencarianScreen />
    </PageContainer>
  );
}
