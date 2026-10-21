import * as Sentry from "@sentry/nextjs";

import type { Session } from "@/features/auth";

export const toSentryUser = (session: Session): Sentry.User => ({
  id: session.code,
  username: session.username,
});

export const identifyUser = (session: Session): void => {
  Sentry.setUser(toSentryUser(session));
  Sentry.setTags({
    "user.role": session.roleUser.name,
    "user.is_admin": String(session.roleUser.isAdmin),
  });
};

export const clearUser = (): void => {
  Sentry.setUser(null);
  Sentry.setTags({ "user.role": undefined, "user.is_admin": undefined });
};
