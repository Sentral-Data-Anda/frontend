import { cookies } from "next/headers";

import { PageContainer } from "@/components/layout/page-container";
import { HomeScreen } from "@/features/beranda/screen";
import {
  DASHBOARD_VIEW_COOKIE,
  readDashboardView,
} from "@/features/beranda/view";

export const metadata = { title: "Beranda" };

export default async function Page() {
  const cookieStore = await cookies();

  return (
    <PageContainer size="full">
      <HomeScreen
        defaultView={readDashboardView(
          cookieStore.get(DASHBOARD_VIEW_COOKIE)?.value,
        )}
      />
    </PageContainer>
  );
}
