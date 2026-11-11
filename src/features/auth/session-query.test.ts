import { afterEach, describe, expect, mock, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import { peekSession, sessionQuery } from "./session-query";

const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
});

const SESSION = {
  code: "USR-01",
  username: "budi",
  status: "ACTIVE",
  roleUser: { name: "Admin", isAdmin: true },
  menu: [],
};

const answer = (response: () => Response) => {
  const calls: string[] = [];

  globalThis.fetch = mock(async (input: string | URL | Request) => {
    calls.push(String(input));
    return response();
  }) as unknown as typeof fetch;

  return calls;
};

const readSession = () => (sessionQuery.queryFn as () => Promise<unknown>)();

describe("sessionQuery", () => {
  test("sesi aktif dibaca dari /auth/me", async () => {
    const calls = answer(() =>
      Response.json({ status: 200, message: "", data: SESSION }),
    );

    expect(await readSession()).toMatchObject({ code: "USR-01" });
    expect(calls[0]).toBe("/api/v1/auth/me");
  });

  test("401 sesudah refresh gagal berarti belum masuk: null, bukan galat", async () => {
    answer(() =>
      Response.json({ status: 401, error: "Unauthorized" }, { status: 401 }),
    );

    expect(await readSession()).toBeNull();
  });

  test("galat server tetap galat", async () => {
    answer(() =>
      Response.json({ status: 500, error: "Rusak" }, { status: 500 }),
    );

    expect(await readSession().catch((error) => error)).toBeInstanceOf(
      FetchError,
    );
  });
});

describe("peekSession", () => {
  test("tidak mencoba refresh", async () => {
    const calls = answer(() =>
      Response.json({ status: 401, error: "Unauthorized" }, { status: 401 }),
    );

    expect(await peekSession()).toBeNull();
    expect(calls).toEqual(["/api/v1/auth/me"]);
  });
});
