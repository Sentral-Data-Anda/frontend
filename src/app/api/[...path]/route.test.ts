import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let route: typeof import("./route");

let lastRequest: {
  method: string;
  url: string;
  cookie: string | null;
  headers: Record<string, string>;
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
        headers: Object.fromEntries(request.headers),
        body: request.method === "GET" ? "" : await request.text(),
      };

      if (url.pathname === "/api/v1/terkompresi") {
        return new Response(
          Bun.gzipSync(
            new TextEncoder().encode(
              JSON.stringify({ status: 200, message: "ok" }),
            ),
          ),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "content-encoding": "gzip",
              server: "Express",
              "x-powered-by": "Express",
            },
          },
        );
      }

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

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;

  route = await import("./route");
});

afterAll(() => {
  server.stop(true);
});

const onCall = (
  method: string,
  path: string[],
  init?: {
    search?: string;
    body?: string;
    cookie?: string;
    headers?: Record<string, string>;
  },
) => {
  const url = `http://localhost:3000/api/${path.join("/")}${init?.search ?? ""}`;

  const request = new Request(url, {
    method,
    body: init?.body,
    headers: {
      ...(init?.cookie ? { cookie: init.cookie } : {}),
      ...init?.headers,
    },
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

  test("cookie milik FE tidak diteruskan ke be-sada", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      cookie: "sidebar_collapsed=1; accessToken=abc; refreshToken=def",
    });

    await route.GET(request as never, context as never);

    expect(lastRequest?.cookie).toBe("accessToken=abc; refreshToken=def");
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

  test("setiap jawaban private, no-store dan tanpa ETag", async () => {
    const { request, context } = onCall("GET", ["v1", "persembahan", "saya"]);

    const response = await route.GET(request as never, context as never);

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("etag")).toBeNull();

    const rejected = await route.GET(
      onCall("GET", ["v1", "..", "admin"]).request as never,
      onCall("GET", ["v1", "..", "admin"]).context as never,
    );

    expect(rejected.headers.get("cache-control")).toBe("private, no-store");
  });

  test("menolak segmen path yang menembus direktori", async () => {
    const { request, context } = onCall("GET", ["v1", "..", "admin"]);

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(400);
  });

  test("menolak segmen hasil decode Next yang menembus direktori", async () => {
    const { request, context } = onCall("GET", ["v1", "../../admin"]);

    const requestBeforeCall = lastRequest;
    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(400);
    expect(lastRequest).toBe(requestBeforeCall);
  });

  test("tidak meneruskan header proxy yang dikendalikan klien", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      headers: {
        "x-forwarded-for": "9.9.9.9",
        "x-forwarded-host": "evil.test",
        "x-forwarded-proto": "http",
        "x-real-ip": "9.9.9.9",
        forwarded: "for=9.9.9.9",
        "x-nonce": "bocor",
      },
    });

    await route.GET(request as never, context as never);

    for (const name of [
      "x-forwarded-for",
      "x-forwarded-host",
      "x-forwarded-proto",
      "x-real-ip",
      "forwarded",
      "x-nonce",
    ]) {
      expect(lastRequest?.headers[name]).toBeUndefined();
    }
  });

  test("tetap meneruskan header yang memang dibutuhkan be-sada", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      cookie: "accessToken=abc",
      headers: {
        accept: "application/json",
        "accept-language": "id-ID",
        authorization: "Bearer xyz",
        "user-agent": "SADA-Test/1.0",
      },
    });

    await route.GET(request as never, context as never);

    expect(lastRequest?.headers.cookie).toBe("accessToken=abc");
    expect(lastRequest?.headers.accept).toBe("application/json");
    expect(lastRequest?.headers["accept-language"]).toBe("id-ID");
    expect(lastRequest?.headers.authorization).toBe("Bearer xyz");
    expect(lastRequest?.headers["user-agent"]).toBe("SADA-Test/1.0");
  });

  test("tidak merelai content-encoding dan header penempatan backend", async () => {
    const { request, context } = onCall("GET", ["v1", "terkompresi"]);

    const response = await route.GET(request as never, context as never);

    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("server")).toBeNull();
    expect(response.headers.get("x-powered-by")).toBeNull();
    expect(await response.json()).toEqual({ status: 200, message: "ok" });
  });

  test("membalas 502 berbadan saat be-sada tidak terjangkau", async () => {
    const reachable = process.env.API_BASE_URL;

    process.env.API_BASE_URL = "http://127.0.0.1:1/api";

    try {
      const { request, context } = onCall("GET", ["v1", "auth", "me"]);

      const response = await route.GET(request as never, context as never);

      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({
        status: 502,
        error: "Layanan sedang tidak dapat dihubungi. Coba lagi sebentar lagi.",
      });
    } finally {
      process.env.API_BASE_URL = reachable;
    }
  });
});
