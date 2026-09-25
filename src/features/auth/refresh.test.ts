import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let server: ReturnType<typeof Bun.serve>;
let refreshSession: typeof import("./refresh").refreshSession;

let hitCount = 0;
let nextStatus = 200;

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    async fetch() {
      hitCount += 1;

      await Bun.sleep(20);

      if (nextStatus !== 200) {
        return Response.json(
          { status: nextStatus, error: "Sesi berakhir" },
          { status: nextStatus },
        );
      }

      return new Response(JSON.stringify({ status: 200, message: "ok" }), {
        status: 200,
        headers: [
          ["content-type", "application/json"],
          [
            "set-cookie",
            "accessToken=baru; Max-Age=900; Domain=api.sada.test; Path=/; HttpOnly",
          ],
          [
            "set-cookie",
            "refreshToken=rotasi; Max-Age=604800; Domain=api.sada.test; Path=/; HttpOnly",
          ],
        ],
      });
    },
  });

  process.env.API_BASE_URL = `http://127.0.0.1:${server.port}/api`;
  ({ refreshSession } = await import("./refresh"));
});

afterAll(() => {
  server.stop(true);
});

describe("refreshSession", () => {
  test("mengembalikan cookie baru tanpa atribut Domain", async () => {
    hitCount = 0;
    nextStatus = 200;

    const result = await refreshSession("refreshToken=lama", "lama");

    expect(result?.setCookie).toHaveLength(2);
    expect(
      result?.setCookie.every(
        (cookie) => !cookie.toLowerCase().includes("domain"),
      ),
    ).toBe(true);
  });

  test("menyusun ulang header Cookie dengan nilai yang baru", async () => {
    nextStatus = 200;

    const result = await refreshSession(
      "refreshToken=lama; theme=dark",
      "lama",
    );

    expect(result?.cookieHeader).toContain("accessToken=baru");
    expect(result?.cookieHeader).toContain("refreshToken=rotasi");
    expect(result?.cookieHeader).toContain("theme=dark");
  });

  test("sepuluh pemanggil bersamaan hanya menghasilkan SATU penyegaran", async () => {
    hitCount = 0;
    nextStatus = 200;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        refreshSession("refreshToken=serentak", "serentak"),
      ),
    );

    expect(hitCount).toBe(1);
    expect(
      results.every((result) =>
        result?.cookieHeader.includes("accessToken=baru"),
      ),
    ).toBe(true);
  });

  test("penyegaran berikutnya menembak lagi setelah yang sebelumnya selesai", async () => {
    hitCount = 0;
    nextStatus = 200;

    await refreshSession("refreshToken=a", "a");
    await refreshSession("refreshToken=a", "a");

    expect(hitCount).toBe(2);
  });

  test("401 mengembalikan null, bukan melempar", async () => {
    nextStatus = 401;

    expect(await refreshSession("refreshToken=mati", "mati")).toBeNull();
  });
});
