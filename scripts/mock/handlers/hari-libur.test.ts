import { describe, expect, test } from "bun:test";

import { hariLiburMock } from "./hari-libur";

type ListedHoliday = {
  id: number;
  date: string;
  originDate: string;
  deletedAt: string | null;
};

type ListBody = {
  totalData: number;
  totalPage: number;
  data: ListedHoliday[];
};

const onFetchHolidayMock = async (input: string) => {
  const url = new URL(input, "http://mock.test");
  const request = new Request(url);

  return (await hariLiburMock({
    request,
    url,
    path: url.pathname.replace(/^\/api\/v1/, ""),
    method: "GET",
    can: () => true,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;
};

const onList = async (query: string) => {
  const response = await onFetchHolidayMock(`/hari-libur?${query}`);

  return { status: response.status, body: (await response.json()) as ListBody };
};

const idsOf = (body: ListBody) => body.data.map((row) => row.id);

describe("mock GET /hari-libur dengan year", () => {
  test("kejadian di tahun itu, urut tanggal lalu nama, paging di server", async () => {
    const first = await onList("year=2026&page=1&limit=10");
    const second = await onList("year=2026&page=2&limit=10");

    expect(first.body.totalData).toBe(13);
    expect(first.body.totalPage).toBe(2);
    expect(idsOf(first.body)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 13]);
    expect(idsOf(second.body)).toEqual([10, 11, 12]);

    const dates = [...first.body.data, ...second.body.data].map((row) =>
      row.date.slice(0, 10),
    );
    expect(dates).toEqual([...dates].sort());
  });

  test("date = kejadian, originDate = tanggal tersimpan", async () => {
    const { body } = await onList("year=2026&filter=hut");

    expect(body.data[0]).toMatchObject({
      id: 13,
      date: "2026-09-27T00:00:00.000Z",
      originDate: "1985-09-27T00:00:00.000Z",
      deletedAt: null,
    });
  });

  test("29 Februari berulang hanya di tahun kabisat, tidak sebelum tahun asal", async () => {
    expect(idsOf((await onList("year=2028")).body)).toEqual([14, 13]);
    expect(idsOf((await onList("year=2027")).body)).toEqual([13]);
    expect(idsOf((await onList("year=2023")).body)).toEqual([13]);
    expect((await onList("year=1984")).status).toBe(404);
  });
});

describe("mock GET /hari-libur tanpa year", () => {
  test("tanggal tersimpan apa adanya dan originDate = date", async () => {
    const { body } = await onList("limit=100");

    expect(body.totalData).toBe(14);
    expect(body.data.every((row) => row.originDate === row.date)).toBe(true);
    expect(body.data[0]).toMatchObject({
      id: 13,
      date: "1985-09-27T00:00:00.000Z",
    });
  });

  test("GET /:id tanpa originDate", async () => {
    const response = await onFetchHolidayMock("/hari-libur/13");
    const { data } = (await response.json()) as { data: object };

    expect(data).not.toHaveProperty("originDate");
    expect(data).toMatchObject({ date: "1985-09-27T00:00:00.000Z" });
  });
});
