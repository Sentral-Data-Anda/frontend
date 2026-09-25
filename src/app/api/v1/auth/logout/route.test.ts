import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

let server: ReturnType<typeof Bun.serve>;
let route: typeof import("./route");

let nextStatus = 200;
let lastRequest: { method: string; path: string; cookie: string | null };

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(request) {
      lastRequest = {
        method: request.method,
        path: new URL(request.url).pathname,
        cookie: request.headers.get("cookie"),
      };

      return Response.json({ status: nextStatus }, { status: nextStatus });
    },
  });

  route = await import("./route");
});

afterAll(() => {
  server.stop(true);
});

const logout = () =>
  route.DELETE(
    new NextRequest("http://localhost:3000/api/v1/auth/logout", {
      method: "DELETE",
      headers: { cookie: "accessToken=a; refreshToken=r" },
    }),
  );

const expectCookiesCleared = (response: Response) => {
  expect(response.status).toBe(204);

  const cleared = response.headers.getSetCookie();

  for (const name of ["accessToken", "refreshToken"]) {
    const cookie = cleared.find((value) => value.startsWith(`${name}=;`));

    expect(cookie).toBeDefined();
    expect(cookie).toContain("Path=/");
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
  }
};

describe("DELETE /api/v1/auth/logout", () => {
  test("be-sada 200: diteruskan dengan cookie, cookie dihapus", async () => {
    process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;
    nextStatus = 200;

    expectCookiesCleared(await logout());
    expect(lastRequest).toEqual({
      method: "DELETE",
      path: "/api/v1/auth/logout",
      cookie: "accessToken=a; refreshToken=r",
    });
  });

  test("be-sada 401: cookie tetap dihapus", async () => {
    process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;
    nextStatus = 401;

    expectCookiesCleared(await logout());
  });

  test("be-sada tidak terjangkau: cookie tetap dihapus", async () => {
    process.env.API_BASE_URL = "http://127.0.0.1:9/api";

    expectCookiesCleared(await logout());
  });
});
