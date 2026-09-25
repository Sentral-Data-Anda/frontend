import { cookies } from "next/headers";

import { PageContainer } from "@/components/layout";
import {
  HomeScreen,
  DASHBOARD_VIEW_COOKIE,
  readDashboardView,
} from "@/features/beranda";

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
