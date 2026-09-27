import { describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "../../../src/lib/date";

import { ibadahMock } from "./ibadah";

type Listed = {
  code: string;
  date: string;
  startTime: string;
  endTime: string | null;
  preacher: string | null;
  typeIbadah: { id: number; name: string };
  room: { name: string } | null;
  jadwalPelayan: { id: number } | null;
  maleCount: number;
  typeIbadahId?: number;
};

const TODAY = todayJakarta();

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: () => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = (await ibadahMock({
    request,
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;

  return {
    status: response.status,
    body: (await response.json()) as {
      error?: string;
      message?: string;
      issues?: { path: string; message: string }[];
      totalData: number;
      data: Listed[] & Listed;
    },
  };
};

const lastWeekday = (weekday: number, weeksBack = 0) => {
  const today = new Date(`${TODAY}T00:00:00Z`).getUTCDay();

  return addDays(TODAY, -(((today - weekday + 7) % 7 || 7) + weeksBack * 7));
};

const findOn = async (date: string, typeIbadahId: number) =>
  (await onCall("GET", `/ibadah?date=${date}&limit=100`)).body.data.find(
    (row) => row.typeIbadah.id === typeIbadahId,
  ) as Listed;

const BODY = {
  typeIbadahId: 3,
  date: addDays(TODAY, 40),
  startTime: "06:00",
  endTime: "07:00",
  theme: null,
  bibleVerse: null,
  preacher: null,
  roomId: null,
  bapelId: null,
  jadwalPelayanId: null,
  maleCount: 0,
  femaleCount: 0,
  childCount: 0,
  note: null,
};

describe("GET /ibadah untuk Beranda", () => {
  test("hari ini: dua ibadah Minggu persis bentuk Beranda", async () => {
    const { body } = await onCall("GET", `/ibadah?date=${TODAY}&limit=100`);

    expect(
      body.data.map((row) => [
        row.typeIbadah.name,
        row.startTime,
        row.endTime,
        row.preacher,
        row.room?.name,
      ]),
    ).toEqual([
      ["Ibadah Minggu II", "17:00", "18:30", null, "Gedung Gereja"],
      [
        "Ibadah Minggu I",
        "08:00",
        "09:30",
        "Pdt. Yohanes Simatupang",
        "Gedung Gereja",
      ],
    ]);
  });

  test("rentang hanya bila startDate dan endDate ada; urut tanggal lalu jam, terbaru dulu", async () => {
    const { body } = await onCall(
      "GET",
      `/ibadah?startDate=${TODAY}&endDate=${addDays(TODAY, 6)}&limit=100`,
    );
    const keys = body.data.map((row) => `${row.date}${row.startTime}`);

    expect(body.data.every((row) => row.date.slice(0, 10) >= TODAY)).toBe(true);
    expect(keys).toEqual([...keys].sort().reverse());

    const onlyStart = await onCall(
      "GET",
      `/ibadah?startDate=${TODAY}&limit=100`,
    );
    expect(onlyStart.body.totalData).toBeGreaterThan(body.totalData);
  });

  test("tanpa VIEW: 403", async () => {
    const { status } = await onCall("GET", "/ibadah", undefined, () => false);

    expect(status).toBe(403);
  });
});

describe("POST /ibadah", () => {
  test("validasi be-sada: issue pertama menurut urutan field, jam selesai terakhir", async () => {
    const empty = await onCall("POST", "/ibadah", { date: null });
    expect(empty.status).toBe(400);
    expect(empty.body.error).toBe("Mohon Lengkapi Tipe Ibadah");
    expect(empty.body.issues?.map((issue) => issue.path)).toEqual([
      "typeIbadahId",
      "date",
      "startTime",
    ]);

    const endBefore = await onCall("POST", "/ibadah", {
      ...BODY,
      endTime: "05:00",
    });
    expect(endBefore.body.issues).toEqual([
      {
        path: "endTime",
        message: "Jam Selesai harus setelah Jam Mulai Ibadah",
      },
    ]);
  });

  test("tipe nonaktif 400; duplikat 409; sukses 201 dengan baris mentah dan kode per tipe", async () => {
    const inactive = await onCall("POST", "/ibadah", {
      ...BODY,
      typeIbadahId: 5,
    });
    expect(inactive.body.error).toBe(
      "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
    );

    const created = await onCall("POST", "/ibadah", BODY);
    expect(created.status).toBe(201);
    expect(created.body.data.typeIbadahId).toBe(3);
    expect(created.body.data.typeIbadah).toBeUndefined();
    expect(created.body.data.code).toMatch(/^IBD_0003-\d{4}-\d{4}$/);

    const duplicate = await onCall("POST", "/ibadah", BODY);
    expect(duplicate.status).toBe(409);
  });
});

describe("PUT dan DELETE /ibadah/:code", () => {
  test("PUT mengganti seluruh baris; field yang tidak dikirim jadi null/0", async () => {
    const row = await findOn(lastWeekday(0, 3), 1);
    const { status, body } = await onCall("PUT", `/ibadah/${row.code}`, {
      typeIbadahId: 1,
      date: row.date.slice(0, 10),
      startTime: "08:00",
    });

    expect(status).toBe(200);
    expect(body.data).toMatchObject({
      endTime: null,
      theme: null,
      roomId: null,
      maleCount: 0,
    });
  });

  test("ibadah bertipe nonaktif: tetap bisa diubah, tapi tidak bisa pindah ke tipe nonaktif", async () => {
    const { body } = await onCall("GET", "/ibadah?typeIbadahId=5");
    const padang = body.data[0];

    const keep = await onCall("PUT", `/ibadah/${padang.code.toLowerCase()}`, {
      ...BODY,
      typeIbadahId: 5,
      date: padang.date.slice(0, 10),
    });
    expect(keep.status).toBe(200);

    const other = await findOn(lastWeekday(3, 3), 3);
    const move = await onCall("PUT", `/ibadah/${other.code}`, {
      ...BODY,
      typeIbadahId: 5,
      date: other.date.slice(0, 10),
    });
    expect(move.body.error).toBe(
      "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
    );
  });

  test("jadwal pelayan tersimpan tetap tertaut walau jam digeser", async () => {
    const linked = await findOn(lastWeekday(0), 1);
    expect(linked.jadwalPelayan?.id).toBe(1);

    const { status } = await onCall("PUT", `/ibadah/${linked.code}`, {
      ...BODY,
      typeIbadahId: 1,
      date: linked.date.slice(0, 10),
      startTime: "11:00",
      endTime: null,
      jadwalPelayanId: 1,
    });

    expect(status).toBe(200);
    expect((await findOn(lastWeekday(0), 1)).jadwalPelayan?.id).toBe(1);
  });

  test("hapus: persembahan ACTIVE 400, hanya VOID berhasil, lalu 404", async () => {
    const active = await findOn(lastWeekday(0, 1), 1);
    const refused = await onCall("DELETE", `/ibadah/${active.code}`);
    expect(refused.status).toBe(400);
    expect(refused.body.error).toBe(
      "Ibadah Tidak Dapat Dihapus Karena Sudah Memiliki Data Persembahan",
    );

    const voided = await findOn(lastWeekday(3, 1), 3);
    expect((await onCall("DELETE", `/ibadah/${voided.code}`)).status).toBe(200);
    expect((await onCall("GET", `/ibadah/${voided.code}`)).body.error).toBe(
      "Ibadah Tidak Ditemukan",
    );
  });

  test("PUT body invalid ke kode yang tidak ada: 400 lebih dulu dari 404", async () => {
    expect((await onCall("PUT", "/ibadah/IBD_X", {})).status).toBe(400);
    expect((await onCall("PUT", "/ibadah/IBD_X", BODY)).status).toBe(404);
  });
});
