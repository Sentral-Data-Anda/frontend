import { PageContainer } from "@/components/layout/page-container";

import { HomeScreen } from "./home-screen";

export const metadata = { title: "Beranda" };

export default function Page() {
  return (
    <PageContainer size="wide">
      <HomeScreen />
    </PageContainer>
  );
}
