import { createFileRoute, redirect } from "@tanstack/react-router";

import { withSiteName } from "@/config/site";
import { peekSession } from "@/features/auth";
import { LoginScreen } from "@/features/auth/ui";

import { validateAuthSearch } from "../../-ui/auth-search";

export const Route = createFileRoute("/_auth/login/")({
  validateSearch: validateAuthSearch,
  // Masih masuk: lanjut ke /authentication.
  beforeLoad: async ({ search }) => {
    const session = await peekSession().catch(() => null);

    if (session) {
      throw redirect({
        to: "/authentication",
        search: { redirect: search.redirect },
      });
    }
  },
  head: () => ({ meta: [{ title: withSiteName("Masuk") }] }),
  component: LoginScreen,
});
