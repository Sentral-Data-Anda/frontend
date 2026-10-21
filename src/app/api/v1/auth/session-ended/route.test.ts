import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

import { GET } from "./route";

const call = () =>
  GET(
    new NextRequest("http://localhost:3000/api/v1/auth/session-ended", {
      headers: { cookie: "accessToken=a; refreshToken=r" },
    }),
  );

describe("GET /api/v1/auth/session-ended", () => {
  test("mengalihkan ke /login", async () => {
    const response = await call();

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/login",
    );
  });

  test("kedua cookie sesi dihapus", async () => {
    const cleared = (await call()).headers.getSetCookie();

    for (const name of ["accessToken", "refreshToken"]) {
      const cookie = cleared.find((value) => value.startsWith(`${name}=;`));

      expect(cookie).toBeDefined();
      expect(cookie).toContain("Path=/");
      expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
    }
  });
});
