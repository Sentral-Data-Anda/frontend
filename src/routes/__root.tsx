import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";

import { LoadingPage, ToastHost } from "@/components/common/feedback";
import { SITE_TITLE } from "@/config/site";
import { AuthHandoff } from "@/features/auth/ui";
import { ServiceWorkerProvider } from "@/features/pwa";

import { NotFound } from "./-ui/not-found";
import { RootError } from "./-ui/root-error";

export interface RouterContext {
  queryClient: QueryClient;
}

const RootLayout = () => (
  <>
    <HeadContent />
    <ServiceWorkerProvider />
    <ToastHost>
      <Outlet />
    </ToastHost>
    <AuthHandoff />
  </>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: SITE_TITLE }] }),
  component: RootLayout,
  pendingComponent: LoadingPage,
  errorComponent: RootError,
  notFoundComponent: NotFound,
});
