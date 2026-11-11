import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import { FetchError, fetchList, fetchOne } from "./fetcher";
import { SESSION_ENDED_PATH } from "./session";

const nativeFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = nativeFetch;
});

const stubFetch = (responseFactory: () => Response) => {
  const calls: { url: string; init?: RequestInit }[] = [];

  globalThis.fetch = mock(
    async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(input), init });
      return responseFactory();
    },
  ) as unknown as typeof fetch;

  return calls;
};

describe("fetchOne", () => {
  test("mengembalikan amplop utuh, bukan hanya data", async () => {
    stubFetch(() =>
      Response.json({ status: 200, message: "Berhasil", data: { id: 1 } }),
    );

    const result = await fetchOne<{ id: number }>("/jemaat/A-0001");

    expect(result.message).toBe("Berhasil");
    expect(result.data.id).toBe(1);
  });

  test("menembak /api/v1 di origin sendiri, bukan be-sada", async () => {
    const calls = stubFetch(() =>
      Response.json({ status: 200, message: "", data: null }),
    );

    await fetchOne("/jemaat");

    expect(calls[0].url).toBe("/api/v1/jemaat");
  });

  test("membaca pesan dari field error, bukan message", async () => {
    stubFetch(() =>
      Response.json(
        { status: 404, error: "Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const error = await fetchOne("/jemaat/X").catch((caught) => caught);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Jemaat Tidak Ditemukan");
  });

  test("tetap punya pesan walau badan respons bukan JSON", async () => {
    stubFetch(() => new Response("<html>502</html>", { status: 502 }));

    const error = await fetchOne("/jemaat").catch((caught) => caught);

    expect(error.status).toBe(502);
    expect(error.message).toContain("502");
  });
});

describe("fetchList", () => {
  test("meneruskan totalData dan totalPage dari level amplop", async () => {
    stubFetch(() =>
      Response.json({
        status: 200,
        message: "Berhasil",
        totalData: 1284,
        totalPage: 65,
        data: [{ id: 1 }],
      }),
    );

    const result = await fetchList<{ id: number }>("/jemaat");

    expect(result.totalData).toBe(1284);
    expect(result.totalPage).toBe(65);
    expect(result.data).toHaveLength(1);
  });

  test("404 pada daftar tetap error", async () => {
    stubFetch(() =>
      Response.json(
        { status: 404, error: "Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const error = await fetchList("/jemaat?search=zzz").catch(
      (caught) => caught,
    );

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("Jemaat Tidak Ditemukan");
  });

  test("500 pada daftar tetap error", async () => {
    stubFetch(() =>
      Response.json(
        { status: 500, error: "Internal Server Error" },
        { status: 500 },
      ),
    );

    const error = await fetchList("/jemaat").catch((caught) => caught);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(500);
    expect(error.code).toBeNull();
  });

  test("membawa code dari badan galat", async () => {
    stubFetch(() =>
      Response.json(
        {
          status: 403,
          error: "Verifikasi Password Diperlukan",
          code: "STEP_UP_REQUIRED",
        },
        { status: 403 },
      ),
    );

    const error = await fetchList("/persembahan/saya").catch(
      (caught) => caught,
    );

    expect(error.status).toBe(403);
    expect(error.code).toBe("STEP_UP_REQUIRED");
  });

  test("mengirim Content-Type hanya bila ada badan", async () => {
    const calls = stubFetch(() =>
      Response.json({ status: 200, message: "", data: [] }),
    );

    await fetchList("/jemaat");
    await fetchOne("/jemaat", { method: "POST", body: JSON.stringify({}) });

    expect(new Headers(calls[0].init?.headers).get("content-type")).toBeNull();
    expect(new Headers(calls[1].init?.headers).get("content-type")).toBe(
      "application/json",
    );
  });

  test("FormData dikirim tanpa Content-Type supaya boundary dipasang peramban", async () => {
    const calls = stubFetch(() =>
      Response.json({ status: 201, message: "", data: null }),
    );
    const body = new FormData();
    body.append("name", "Retret");

    await fetchOne("/event", { method: "POST", body });

    expect(new Headers(calls[0].init?.headers).get("content-type")).toBeNull();
    expect(calls[0].init?.body).toBe(body);
  });
});

describe("sesi yang ditolak", () => {
  const replace = spyOn(window.location, "replace").mockImplementation(
    () => {},
  );

  afterEach(() => replace.mockClear());
  afterAll(() => replace.mockRestore());

  test("401 dari endpoint terautentikasi mengakhiri sesi", async () => {
    stubFetch(() =>
      Response.json({ status: 401, error: "Unauthorized" }, { status: 401 }),
    );

    const error = await fetchList("/jemaat").catch((caught) => caught);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(401);
    expect(replace).toHaveBeenCalledWith(SESSION_ENDED_PATH);
  });

  test("401 dari login adalah kredensial salah, bukan sesi berakhir", async () => {
    stubFetch(() =>
      Response.json(
        { status: 401, error: "Username atau password tidak valid." },
        { status: 401 },
      ),
    );

    await fetchOne("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "x", password: "y" }),
    }).catch(() => {});

    expect(replace).not.toHaveBeenCalled();
  });

  test("403 tidak mengakhiri sesi: izin kurang, sesinya masih sah", async () => {
    stubFetch(() =>
      Response.json(
        { status: 403, error: "Tidak punya akses" },
        { status: 403 },
      ),
    );

    await fetchList("/jemaat").catch(() => {});

    expect(replace).not.toHaveBeenCalled();
  });
});

describe("401 diberi satu kesempatan", () => {
  let replace: ReturnType<typeof spyOn>;

  beforeAll(() => {
    replace = spyOn(window.location, "replace").mockImplementation(() => {});
  });
  afterEach(() => replace.mockClear());
  afterAll(() => replace.mockRestore());

  const OK = () =>
    Response.json({ status: 200, message: "Berhasil", data: { id: 1 } });
  const UNAUTHORIZED = () =>
    Response.json({ status: 401, error: "Unauthorized" }, { status: 401 });

  /** Jawaban per URL, berurutan; jawaban terakhir dipakai ulang. */
  const script = (answers: Record<string, (() => Response)[]>) => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const cursor: Record<string, number> = {};

    globalThis.fetch = mock(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        const queue = answers[url] ?? [OK];
        const index = Math.min(cursor[url] ?? 0, queue.length - 1);

        cursor[url] = (cursor[url] ?? 0) + 1;
        calls.push({ url, init });

        return queue[index]();
      },
    ) as unknown as typeof fetch;

    return calls;
  };

  const REFRESH = "/api/v1/auth/refresh-token";

  test("ulang lebih dulu: tab lain mungkin sudah merotasi, refresh tidak dipanggil", async () => {
    const calls = script({ "/api/v1/jemaat": [UNAUTHORIZED, OK] });

    const result = await fetchOne<{ id: number }>("/jemaat");

    expect(result.data.id).toBe(1);
    expect(calls.map((call) => call.url)).toEqual([
      "/api/v1/jemaat",
      "/api/v1/jemaat",
    ]);
    expect(replace).not.toHaveBeenCalled();
  });

  test("masih 401: refresh sekali lalu ulang permintaan asli", async () => {
    const calls = script({
      "/api/v1/jemaat": [UNAUTHORIZED, UNAUTHORIZED, OK],
      [REFRESH]: [OK],
    });

    const result = await fetchOne<{ id: number }>("/jemaat");

    expect(result.data.id).toBe(1);
    expect(calls.map((call) => call.url)).toEqual([
      "/api/v1/jemaat",
      "/api/v1/jemaat",
      REFRESH,
      "/api/v1/jemaat",
    ]);
  });

  test("refresh ditolak: sesi berakhir ke /login?reason=session-ended", async () => {
    const calls = script({
      "/api/v1/jemaat": [UNAUTHORIZED],
      [REFRESH]: [UNAUTHORIZED],
    });

    const error = await fetchOne("/jemaat").catch((caught) => caught);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(401);
    expect(calls.filter((call) => call.url === REFRESH)).toHaveLength(1);
    expect(replace).toHaveBeenCalledWith("/login?reason=session-ended");
  });

  test("permintaan bersamaan hanya memicu satu refresh", async () => {
    let isRefreshed = false;
    const calls: string[] = [];

    globalThis.fetch = mock(async (input: string | URL | Request) => {
      const url = String(input);

      calls.push(url);

      if (url === REFRESH) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        isRefreshed = true;
        return OK();
      }

      return isRefreshed ? OK() : UNAUTHORIZED();
    }) as unknown as typeof fetch;

    const results = await Promise.all([
      fetchOne<{ id: number }>("/jemaat"),
      fetchList<{ id: number }>("/keluarga"),
      fetchOne<{ id: number }>("/auth/me"),
    ]);

    expect(results).toHaveLength(3);
    expect(calls.filter((url) => url === REFRESH)).toHaveLength(1);
    expect(replace).not.toHaveBeenCalled();
  });

  test("badan permintaan dikirim ulang apa adanya", async () => {
    const body = JSON.stringify({ name: "Budi" });
    const calls = script({
      "/api/v1/jemaat": [UNAUTHORIZED, UNAUTHORIZED, OK],
      [REFRESH]: [OK],
    });

    await fetchOne("/jemaat", { method: "POST", body });

    const posts = calls.filter((call) => call.url === "/api/v1/jemaat");

    expect(posts).toHaveLength(3);
    expect(posts.every((call) => call.init?.body === body)).toBe(true);
    expect(posts.every((call) => call.init?.method === "POST")).toBe(true);
  });

  test("jaringan putus saat refresh adalah galat biasa, bukan sesi berakhir", async () => {
    globalThis.fetch = mock(async (input: string | URL | Request) => {
      if (String(input) === REFRESH) throw new TypeError("Failed to fetch");
      return UNAUTHORIZED();
    }) as unknown as typeof fetch;

    const error = await fetchOne("/jemaat").catch((caught) => caught);

    expect(error).toBeInstanceOf(TypeError);
    expect(replace).not.toHaveBeenCalled();
  });

  test.each(["/auth/login", "/auth/logout", "/auth/refresh-token"])(
    "%s tidak diulang dan tidak memicu refresh",
    async (path) => {
      const calls = script({ [`/api/v1${path}`]: [UNAUTHORIZED] });

      await fetchOne(path, { method: "POST" }).catch(() => {});

      expect(calls).toHaveLength(1);
    },
  );
});
