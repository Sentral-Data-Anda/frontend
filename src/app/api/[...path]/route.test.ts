import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let route: typeof import("./route");

let callCount = 0;

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

      callCount += 1;

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

      if (url.pathname === "/api/v1/auth/refresh-token") {
        // Hanya satu id yang masih bisa disegarkan; sisanya sudah dicabut.
        if (!request.headers.get("cookie")?.includes("refreshToken=hidup")) {
          return Response.json(
            { status: 401, error: "Unauthorized" },
            { status: 401 },
          );
        }

        return new Response(JSON.stringify({ status: 200 }), {
          status: 200,
          headers: [
            ["content-type", "application/json"],
            [
              "set-cookie",
              "accessToken=baru; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly",
            ],
          ],
        });
      }

      // Menolak access token lama dan menerima yang baru, seperti be-sada saat
      // token di cookie sudah kedaluwarsa menurut jamnya.
      if (url.pathname === "/api/v1/kedaluwarsa") {
        if (!request.headers.get("cookie")?.includes("accessToken=baru")) {
          return Response.json(
            { status: 401, error: "Unauthorized" },
            { status: 401 },
          );
        }

        return Response.json({ status: 200, message: "ok", data: null });
      }

      if (url.pathname === "/api/v1/sesi-mati") {
        return Response.json(
          { status: 401, error: "Unauthorized" },
          { status: 401 },
        );
      }

      if (url.pathname === "/api/v1/tanpa-izin") {
        return Response.json(
          { status: 403, error: "Forbidden" },
          { status: 403 },
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

/** Nama cookie yang dihapus oleh respons, dibaca dari Set-Cookie-nya. */
const clearedCookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .filter((cookie) => /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(cookie))
    .map((cookie) => cookie.slice(0, cookie.indexOf("=")))
    .sort();

describe("sesi yang ditolak be-sada", () => {
  // Proxy hanya menyegarkan token ketika cookie access-nya sudah hilang, jadi
  // tanpa pembersihan ini perangkat yang sesinya dicabut terus mengirim token
  // mati sampai cookienya kedaluwarsa sendiri, tanpa pernah keluar.
  test("401 menghapus kedua cookie sesi", async () => {
    const { request, context } = onCall("GET", ["v1", "sesi-mati"], {
      cookie: "accessToken=abc; refreshToken=def",
    });

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(401);
    expect(clearedCookies(response)).toEqual(["accessToken", "refreshToken"]);
  });

  test("403 tidak menghapus apa pun: izin kurang, sesinya masih sah", async () => {
    const { request, context } = onCall("GET", ["v1", "tanpa-izin"], {
      cookie: "accessToken=abc; refreshToken=def",
    });

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(403);
    expect(clearedCookies(response)).toEqual([]);
  });

  test("200 tidak menghapus apa pun", async () => {
    const { request, context } = onCall("GET", ["v1", "jemaat"], {
      cookie: "accessToken=abc; refreshToken=def",
    });

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(200);
    expect(clearedCookies(response)).toEqual([]);
  });
});

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

describe("menyegarkan token saat kena 401", () => {
  // src/proxy.ts hanya menyegarkan ketika cookie access-nya sudah hilang.
  // Cookie yang masih terpasang tapi ditolak be-sada — jam klien meleset, atau
  // SECRET_ACCESS_TOKEN berganti saat deploy — tidak pernah lewat jalur itu.
  test("GET: segarkan sekali lalu ulangi, pengguna tidak dikeluarkan", async () => {
    const { request, context } = onCall("GET", ["v1", "kedaluwarsa"], {
      cookie: "accessToken=mati; refreshToken=hidup",
    });

    callCount = 0;

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(200);
    expect(clearedCookies(response)).toEqual([]);
    // Permintaan pertama, refresh, lalu ulangan.
    expect(callCount).toBe(3);
    // Cookie baru diteruskan supaya browser ikut memakai sesi yang disegarkan.
    expect(
      response.headers
        .getSetCookie()
        .some((cookie) => cookie.startsWith("accessToken=baru")),
    ).toBe(true);
    // Domain milik be-sada tidak boleh ikut, cookienya harus jadi milik origin ini.
    expect(response.headers.getSetCookie().join(";")).not.toContain("Domain=");
  });

  test("GET: refresh yang gagal tetap mengeluarkan pengguna", async () => {
    const { request, context } = onCall("GET", ["v1", "kedaluwarsa"], {
      cookie: "accessToken=mati; refreshToken=dicabut",
    });

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(401);
    expect(clearedCookies(response)).toEqual(["accessToken", "refreshToken"]);
  });

  // Badan permintaan dialirkan langsung (`duplex: "half"`), jadi sesudah
  // jawabannya tiba badan itu sudah habis dan tidak bisa dikirim ulang.
  test("POST tidak diulang", async () => {
    const { request, context } = onCall("POST", ["v1", "kedaluwarsa"], {
      body: JSON.stringify({ a: 1 }),
      cookie: "accessToken=mati; refreshToken=hidup",
      headers: { "content-type": "application/json" },
    });

    callCount = 0;

    const response = await route.POST(request as never, context as never);

    expect(response.status).toBe(401);
    expect(callCount).toBe(1);
    expect(clearedCookies(response)).toEqual(["accessToken", "refreshToken"]);
  });

  // Menyegarkan sesudah menyegarkan berarti memakai ulang id yang baru saja
  // ditukar, dan itulah yang dibaca be-sada sebagai pencurian token.
  test("refresh-token sendiri tidak diulang", async () => {
    const { request, context } = onCall(
      "GET",
      ["v1", "auth", "refresh-token"],
      {
        cookie: "accessToken=mati; refreshToken=dicabut",
      },
    );

    callCount = 0;

    const response = await route.GET(request as never, context as never);

    expect(response.status).toBe(401);
    expect(callCount).toBe(1);
  });
});
