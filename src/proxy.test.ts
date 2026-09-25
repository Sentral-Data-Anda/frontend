import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

let server: ReturnType<typeof Bun.serve>;
let proxy: typeof import("./proxy").proxy;

let refreshHits = 0;

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch() {
      refreshHits += 1;
      return Response.json({ status: 401 }, { status: 401 });
    },
  });

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;
  ({ proxy } = await import("./proxy"));
});

afterAll(() => {
  server.stop(true);
});

const request = (path: string, refreshToken: string) =>
  new NextRequest(`http://localhost:3000${path}`, {
    method: "DELETE",
    headers: { cookie: `refreshToken=${refreshToken}` },
  });

describe("proxy", () => {
  test("logout tanpa access cookie tidak memicu penyegaran", async () => {
    refreshHits = 0;

    const response = await proxy(request("/api/v1/auth/logout", "r1"));

    expect(refreshHits).toBe(0);
    expect(response.status).toBe(200);
  });

  test("pembanding: API lain tanpa access cookie memang disegarkan", async () => {
    refreshHits = 0;

    const response = await proxy(request("/api/v1/jemaat", "r2"));

    expect(refreshHits).toBe(1);
    expect(response.status).toBe(401);
  });
});
