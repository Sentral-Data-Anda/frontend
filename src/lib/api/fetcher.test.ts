import {
  afterAll,
  afterEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

import { SESSION_ENDED_PATH } from "./cookie";
import { FetchError, fetchList, fetchOne } from "./fetcher";

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
