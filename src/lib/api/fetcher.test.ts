import { afterEach, describe, expect, mock, test } from "bun:test";

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

  test("404 pada daftar jadi daftar kosong, bukan error", async () => {
    stubFetch(() =>
      Response.json(
        { status: 404, error: "Jemaat Tidak Ditemukan" },
        { status: 404 },
      ),
    );

    const result = await fetchList("/jemaat?search=zzz");

    expect(result.data).toEqual([]);
    expect(result.totalData).toBe(0);
    expect(result.status).toBe(404);
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
});
