import { cookies } from "next/headers";

import { PageContainer } from "@/components/layout/page-container";
import { HomeScreen } from "@/features/beranda/screen";
import {
  DASHBOARD_VIEW_COOKIE,
  readDashboardView,
} from "@/features/beranda/view";

export const metadata = { title: "Beranda" };

/**
 * Pilihan tampilan dibaca di server (cookie), seperti `sidebar_collapsed`:
 * render pertama sudah tampilan yang dipilih, tanpa kedipan.
 */
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
