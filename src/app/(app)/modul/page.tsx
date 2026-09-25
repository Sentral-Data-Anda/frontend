import { PageContainer } from "@/components/layout";
import { PencarianScreen } from "@/features/pencarian";

export const metadata = { title: "Pencarian" };

export default function Page() {
  return (
    <PageContainer>
      <PencarianScreen />
    </PageContainer>
  );
}
