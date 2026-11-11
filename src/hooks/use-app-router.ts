import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

type NavigateOptions = { scroll?: boolean };

export type AppRouter = {
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  back: () => void;
  refresh: () => void;
};

/** Bentuk `useRouter` Next, di atas TanStack Router. */
export function useAppRouter(): AppRouter {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      push: (href, options) =>
        void navigate({ href, resetScroll: options?.scroll ?? true }),
      replace: (href, options) =>
        void navigate({
          href,
          replace: true,
          resetScroll: options?.scroll ?? true,
        }),
      back: () => router.history.back(),
      refresh: () => {
        void router.invalidate();
        void queryClient.invalidateQueries();
      },
    }),
    [navigate, router, queryClient],
  );
}

/** Query string URL sebagai `URLSearchParams`, stabil selama URL-nya sama. */
export function useAppSearchParams(): URLSearchParams {
  const searchStr = useLocation({ select: (location) => location.searchStr });

  return useMemo(() => new URLSearchParams(searchStr), [searchStr]);
}

export function useAppPathname(): string {
  return useLocation({ select: (location) => location.pathname });
}
