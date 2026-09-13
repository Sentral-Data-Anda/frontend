import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let route: typeof import("./route");

let lastRequest: {
  method: string;
  url: string;
  cookie: string | null;
  body: string;
} | null = null;

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);

      lastRequest = {
        method: request.method,
        url: url.pathname + url.search,
        cookie: request.headers.get("cookie"),
        body: request.method === "GET" ? "" : await request.text(),
      };

      if (url.pathname === "/api/v1/auth/login") {
        return new Response(
          JSON.stringify({ status: 200, message: "Berhasil Login" }),
          {
            status: 200,
            headers: [
              ["content-type", "application/json"],
              [
                "set-cookie",
                "accessToken=abc; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly; SameSite=Strict",
              ],
              [
                "set-cookie",
                "refreshToken=def; Max-Age=604800; Domain=api.sada.test; Path=/; HttpOnly; SameSite=Strict",
              ],
            ],
          },
        );
      }

      return Response.json({ status: 200, message: "ok", data: null });
    },
  });

  // `@/lib/env` memvalidasi dan MEMBEKUKAN API_BASE_URL sekali saat modul
  // pertama diimpor di seluruh proses `bun test` — client.test.ts juga
  // mengimpornya lewat pola yang sama. Bila di sini cuma process.env yang
  // diarahkan, siapa pun yang lebih dulu mengimpor "@/lib/env" di proses ini
  // menang, dan urutan itu tidak terjamin saat seluruh test suite dijalankan
  // bersamaan — route ini bisa berakhir menembak server milik test lain yang
  // sudah berhenti ("Connection refused"). Modul di-mock langsung di sini,
  // sama seperti "server-only" di atas, supaya nilainya milik test ini
  // sendiri tanpa bergantung pada urutan berkas test lain.
  mock.module("@/lib/env", () => ({
    env: { API_BASE_URL: `http://127.0.0.1:${server.port}/api` },
  }));

  route = await import("./route");
});

afterAll(() => {
  server.stop(true);
});

const onCall = (
  method: string,
  path: string[],
  init?: { search?: string; body?: string; cookie?: string },
) => {
  const url = `http://localhost:3000/api/${path.join("/")}${init?.search ?? ""}`;

  const request = new Request(url, {
    method,
    body: init?.body,
    headers: init?.cookie ? { cookie: init.cookie } : undefined,
  });

  return { request, context: { params: Promise.resolve({ path }) } };
};

describe("BFF", () => {
  test("meneruskan path dan query ke be-sada", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      search: "?page=2",
    });

    await route.GET(request as never, context as never);

    expect(lastRequest?.url).toBe("/api/v1/jemaat?page=2");
  });

  test("meneruskan cookie masuk", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      cookie: "accessToken=abc",
    });

    await route.GET(request as never, context as never);

    expect(lastRequest?.cookie).toBe("accessToken=abc");
  });

  test("meneruskan badan permintaan tulis", async () => {
    const { request, context } = onCall("POST", ["v1", "jemaat"], {
      body: JSON.stringify({ name: "Christian Halim" }),
    });

    await route.POST(request as never, context as never);

    expect(JSON.parse(lastRequest?.body ?? "{}").name).toBe("Christian Halim");
  });

  test("merelai kedua Set-Cookie tanpa atribut Domain", async () => {
    const { request, context } = onCall("POST", ["v1", "auth", "login"], {
      body: JSON.stringify({ username: "a", password: "b" }),
    });

    const response = await route.POST(request as never, context as never);
    const cookies = response.headers.getSetCookie();

    expect(cookies).toHaveLength(2);
    expect(cookies.some((cookie) => cookie.startsWith("accessToken="))).toBe(
      true,
    );
    expect(cookies.some((cookie) => cookie.startsWith("refreshToken="))).toBe(
      true,
    );
    expect(
      cookies.every((cookie) => !cookie.toLowerCase().includes("domain")),
    ).toBe(true);
  });

  test("menolak segmen path yang menembus direktori", async () => {
    const { request, context } = onCall("GET", ["v1", "..", "admin"]);

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(400);
  });
});
