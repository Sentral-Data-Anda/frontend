import { describe, expect, test } from "bun:test";

import { dispatch } from "./dispatch";
import { paging, type MockContext } from "./kit";

type Json = { status?: number; data?: unknown; totalPage?: number };

const call = async (method: string, input: string, body?: unknown) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const context: MockContext = {
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: input.split("?")[0],
    method,
    can: () => true,
    isAdmin: true,
    sessionCode: "test",
  };
  const response = await dispatch(context);

  return {
    status: response?.status ?? 0,
    body: (response ? await response.json() : null) as Json | null,
  };
};

type Row = { publicId: string; code: string; name: string };

const firstRow = async (base: string) => {
  const list = await call("GET", `${base}?page=1&limit=3`);

  return (list.body?.data as Row[])[0];
};

describe("dispatch: a row by its publicId", () => {
  test("finds the row by publicId, as the screens now ask", async () => {
    const row = await firstRow("/zone-church");

    const byPublicId = await call(
      "GET",
      `/zone-church/${encodeURIComponent(row.publicId)}`,
    );

    expect(byPublicId.status).toBe(200);
    expect((byPublicId.body?.data as Row).code).toBe(row.code);
  });

  test("still finds it by the code an old link carries", async () => {
    const row = await firstRow("/zone-church");

    const byCode = await call("GET", `/zone-church/${row.code}`);

    expect(byCode.status).toBe(200);
  });

  test("an identifier the list does not name stays a 404", async () => {
    const missing = await call(
      "GET",
      "/zone-church/00000000-0000-4000-8000-00000000dead",
    );

    expect(missing.status).toBe(404);
  });

  test("a write by publicId reaches the row, and its body survives the retry", async () => {
    const row = await firstRow("/zone-church");

    const saved = await call(
      "PUT",
      `/zone-church/${encodeURIComponent(row.publicId)}`,
      { name: `${row.name} (diubah)`, isActive: true },
    );

    expect(saved.status).toBe(200);

    const reread = await call("GET", `/zone-church/${row.code}`);
    expect((reread.body?.data as Row).name).toBe(`${row.name} (diubah)`);

    // leave the seed as found
    await call("PUT", `/zone-church/${row.code}`, {
      name: row.name,
      isActive: true,
    });
  });
});

describe("mock paging: limit=all", () => {
  test("returns every row on one page, with no ceiling", async () => {
    const some = await call("GET", "/zone-church?page=1&limit=100");
    const all = await call("GET", "/zone-church?page=3&limit=all");

    // `page=3` is read as "everything", not as a jump past the rows.
    expect((all.body?.data as Row[]).length).toBe(
      (some.body?.data as Row[]).length,
    );
    expect(all.body?.totalPage).toBe(1);
  });
});

describe("paging", () => {
  test("`all` is one page of everything, whatever page was asked", () => {
    const { page, limit } = paging(new URL("http://x/?page=3&limit=ALL"));

    expect(page).toBe(1);
    // slice((page - 1) * limit, page * limit) must stay finite.
    expect((page - 1) * limit).toBe(0);
    expect(Number.isFinite(page * limit)).toBe(true);
    expect(limit).toBeGreaterThan(100_000);
  });

  test("a number is still capped at 100", () => {
    expect(paging(new URL("http://x/?limit=5000")).limit).toBe(100);
    expect(paging(new URL("http://x/?limit=25")).limit).toBe(25);
  });
});
