import { describe, expect, test } from "bun:test";

import { eventMock } from "./event";

const call = async (method: string, path: string, body?: FormData) => {
  const url = new URL(`http://mock.test/api/v1${path}`);
  const response = (await eventMock({
    request: new Request(url, { method, body }),
    url,
    path: url.pathname.replace(/^\/api\/v1/, ""),
    method,
    can: () => true,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: await response.json() };
};

// FormData global di test milik happy-dom; Request asli Bun hanya membaca miliknya sendiri.
const NativeFormData = (
  await new Request("http://mock.test", {
    method: "POST",
    body: "a=1",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  }).formData()
).constructor as typeof FormData;

const formOf = (fields: Record<string, string>) => {
  const form = new NativeFormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return form;
};

const RETRET = {
  name: "Retret Pemuda",
  description: "Retret tahunan komisi pemuda.",
  bapelId: "2",
  isIndoor: "0",
  location: "Parapat, Danau Toba",
  capacity: "40",
  isPaid: "1",
  price: "350000",
  startDate: "2026-10-12",
  endDate: "2026-10-14",
  startTime: "07:00",
  isPublish: "1",
};

describe("mock /event", () => {
  test("kode seed unik", async () => {
    const { body } = await call("GET", "/event?limit=100");
    const codes = body.data.map((row: { code: string }) => row.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  test("POST tanpa foto: issue image", async () => {
    const { status, body } = await call("POST", "/event", formOf(RETRET));

    expect(status).toBe(400);
    expect(body.issues[0]).toEqual({
      path: "image",
      message: "Mohon Lengkapi Foto Utama",
    });
  });

  test("PUT ubah harga saat berpendaftar: 400 isPaid; nilai sama lolos", async () => {
    const changed = await call(
      "PUT",
      "/event/evn_0002-2026-0001",
      formOf({ ...RETRET, price: "300000" }),
    );

    expect(changed.status).toBe(400);
    expect(changed.body.issues[0].path).toBe("isPaid");

    const { body: saved } = await call("GET", "/event/EVN_0002-2026-0001");
    const same = await call(
      "PUT",
      "/event/EVN_0002-2026-0001",
      formOf({
        ...RETRET,
        startDate: saved.data.startDate.slice(0, 10),
        endDate: saved.data.endDate.slice(0, 10),
        endTime: saved.data.endTime,
        urlForm: saved.data.urlForm,
        description: saved.data.description,
      }),
    );

    expect(same.status).toBe(200);
    expect(same.body.data.code).toBe("EVN_0002-2026-0001");
  });

  test("PUT kapasitas di bawah pendaftar: 400 capacity", async () => {
    const { status, body } = await call(
      "PUT",
      "/event/EVN_0002-2026-0001",
      formOf({ ...RETRET, capacity: "2" }),
    );

    expect(status).toBe(400);
    expect(body.issues[0]).toEqual({
      path: "capacity",
      message: "Kapasitas Tidak Boleh Kurang Dari 3 Pendaftar",
    });
  });

  test("jam selesai hanya diperiksa di hari yang sama", async () => {
    const sameDay = await call(
      "PUT",
      "/event/EVN_0002-2026-0001",
      formOf({ ...RETRET, endDate: "2026-10-12", endTime: "06:00" }),
    );

    expect(sameDay.body.issues[0].path).toBe("endTime");
  });

  test("DELETE berpendaftar ditolak", async () => {
    const { status, body } = await call("DELETE", "/event/EVN_0002-2026-0001");

    expect(status).toBe(400);
    expect(body.error).toBe(
      "Event Tidak Dapat Dihapus Karena Sudah Memiliki 3 Pendaftar",
    );
  });

  test("tanggal filter tak terbaca: 400", async () => {
    const { status, body } = await call("GET", "/event?startDate=kemarin");

    expect(status).toBe(400);
    expect(body.issues[0].path).toBe("startDate");
  });
});
