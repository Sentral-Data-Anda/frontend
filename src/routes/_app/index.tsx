import { createFileRoute } from "@tanstack/react-router";

import { PageContainer } from "@/components/layout";
import { withSiteName } from "@/config/site";
import {
  HomeScreen,
  DASHBOARD_VIEW_COOKIE,
  readDashboardView,
} from "@/features/beranda";
import { readDocumentCookie } from "@/lib/cookie";

const HomePage = () => (
  <PageContainer size="full">
    <HomeScreen
      defaultView={readDashboardView(readDocumentCookie(DASHBOARD_VIEW_COOKIE))}
    />
  </PageContainer>
);

export const Route = createFileRoute("/_app/")({
  head: () => ({ meta: [{ title: withSiteName("Beranda") }] }),
  component: HomePage,
});
