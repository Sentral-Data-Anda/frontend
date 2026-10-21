import * as Sentry from "@sentry/nextjs";
import { afterEach, describe, expect, test } from "bun:test";

import type { Session } from "@/features/auth";

import { clearUser, identifyUser, toSentryUser } from "./identify-user";

const session: Session = {
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: "Sekretariat", isAdmin: false },
  jemaat: { name: "Andreas Sitanggang" },
  menu: [],
};

afterEach(clearUser);

describe("toSentryUser", () => {
  test("hanya membawa kode dan username, tanpa nama jemaat", () => {
    expect(toSentryUser(session)).toEqual({ id: "U-0001", username: "A-0184" });
  });
});

describe("identifyUser", () => {
  test("memasang user dan tag peran pada scope", () => {
    identifyUser(session);

    const scope = Sentry.getIsolationScope().getScopeData();

    expect(scope.user).toEqual({ id: "U-0001", username: "A-0184" });
    expect(scope.tags).toMatchObject({
      "user.role": "Sekretariat",
      "user.is_admin": "false",
    });
  });

  test("clearUser membersihkan user dan tag peran", () => {
    identifyUser(session);
    clearUser();

    const scope = Sentry.getIsolationScope().getScopeData();

    expect(scope.user).toEqual({});
    expect(scope.tags["user.role"]).toBeUndefined();
  });
});
