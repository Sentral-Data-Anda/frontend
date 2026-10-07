import { readdirSync } from "node:fs";

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";

let server: ReturnType<typeof Bun.serve>;
let proxy: typeof import("./proxy").proxy;
let config: typeof import("./proxy").config;

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
  ({ proxy, config } = await import("./proxy"));
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

/**
 * Aset `public/` yang tidak dikecualikan matcher dialihkan ke `/login` saat
 * pemakai belum login: peramban menerima HTML untuk sebuah PNG dan gagal
 * DIAM-DIAM — `mask-image` tidak punya onerror.
 *
 * Himpunan subjeknya dibaca dari `public/`, bukan didaftar tangan, jadi folder
 * aset BARU otomatis masuk cakupan: itulah yang terlewat untuk `public/loading`.
 */
describe("matcher mengecualikan setiap aset public/", () => {
  const matcherOf = () => new RegExp(`^${config.matcher[0].source}$`);

  const entries = readdirSync(new URL("../public", import.meta.url).pathname, {
    withFileTypes: true,
  });

  test("public/ tidak kosong", () => {
    expect(entries.length).toBeGreaterThan(2);
    expect(entries.map((entry) => entry.name)).toContain("loading");
  });

  test.each(entries.map((entry) => entry.name))("/%s lewat matcher", (name) => {
    expect(matcherOf().test(`/${name}`)).toBe(false);
  });

  test.each(
    entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  )("/%s/<berkas> lewat matcher", (name) => {
    expect(matcherOf().test(`/${name}/sada-s.png`)).toBe(false);
  });

  test("halaman aplikasi tetap lewat proxy", () => {
    expect(matcherOf().test("/kejemaatan/daftar-jemaat")).toBe(true);
    expect(matcherOf().test("/login")).toBe(true);
  });
});
