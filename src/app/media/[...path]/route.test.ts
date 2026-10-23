import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

let server: ReturnType<typeof Bun.serve>;
let route: typeof import("./route");

let seen: {
  method: string;
  url: string;
  range: string | null;
  cookie: string | null;
};
let nextStatus = 200;

const SIGNED = "X-Amz-Signature=abc123&X-Amz-Expires=900";

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    fetch(request) {
      seen = {
        method: request.method,
        url: new URL(request.url).pathname + new URL(request.url).search,
        range: request.headers.get("range"),
        cookie: request.headers.get("cookie"),
      };

      return new Response(nextStatus === 200 ? "isi-berkas" : "x", {
        status: nextStatus,
        headers: {
          "content-type": "image/jpeg",
          "x-amz-request-id": "rahasia",
          "set-cookie": "a=b",
        },
      });
    },
  });

  route = await import("./route");
});

afterAll(() => {
  server.stop(true);
});

const get = (path: string, headers: Record<string, string> = {}) => {
  process.env.MEDIA_UPSTREAM_URL = `http://127.0.0.1:${server.port}`;

  return route.GET(
    new NextRequest(`http://localhost:3000${path}`, { headers }),
  );
};

describe("GET /media/*", () => {
  test("meneruskan ke penyimpanan tanpa awalan /media dan mengembalikan isinya", async () => {
    nextStatus = 200;

    const response = await get(`/media/sada/gallery/a.jpeg?${SIGNED}`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("isi-berkas");
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(seen.url).toBe(`/sada/gallery/a.jpeg?${SIGNED}`);
  });

  test("cookie sesi tidak ikut ke penyimpanan, header penyimpanan tidak bocor", async () => {
    nextStatus = 200;

    const response = await get(`/media/sada/a.jpeg?${SIGNED}`, {
      cookie: "accessToken=a; refreshToken=r",
    });

    expect(seen.cookie).toBeNull();
    expect(response.headers.get("x-amz-request-id")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("Range diteruskan dan 206 dikembalikan", async () => {
    nextStatus = 206;

    const response = await get(`/media/sada/a.pdf?${SIGNED}`, {
      range: "bytes=0-9",
    });

    expect(seen.range).toBe("bytes=0-9");
    expect(response.status).toBe(206);
  });

  test("tanpa tanda tangan: 404 dan penyimpanan tidak dihubungi", async () => {
    seen = { method: "", url: "", range: null, cookie: null };

    const response = await get("/media/sada/a.jpeg");

    expect(response.status).toBe(404);
    expect(seen.url).toBe("");
  });

  test("tautan kedaluwarsa (403 dari penyimpanan) diteruskan apa adanya", async () => {
    nextStatus = 403;

    expect((await get(`/media/sada/a.jpeg?${SIGNED}`)).status).toBe(403);
  });

  test("status tak terduga dari penyimpanan menjadi 502", async () => {
    nextStatus = 500;

    expect((await get(`/media/sada/a.jpeg?${SIGNED}`)).status).toBe(502);
  });

  test("penyimpanan tak terjangkau menjadi 502", async () => {
    process.env.MEDIA_UPSTREAM_URL = "http://127.0.0.1:9";

    const response = await route.GET(
      new NextRequest(`http://localhost:3000/media/sada/a.jpeg?${SIGNED}`),
    );

    expect(response.status).toBe(502);
  });
});
