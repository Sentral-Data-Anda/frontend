import { afterAll, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { addDays } from "../../../src/lib/date";
import { LOAN, TODAY } from "../fasilitas-store";

import { peminjamanRuangMock } from "./peminjaman-ruang";

const snapshot = structuredClone(LOAN);

afterAll(() => {
  LOAN.splice(0, LOAN.length, ...snapshot);
});

const call = async (
  method: string,
  path: string,
  body?: unknown,
  grants: MenuSlug[] = [MENU.PEMINJAMAN_RUANG],
) => {
  const url = new URL(path, "http://mock.test");
  const response = await peminjamanRuangMock({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: url.pathname,
    method,
    can: (slug) => grants.includes(slug),
    isAdmin: false,
    sessionCode: "test",
  });

  return { status: response!.status, body: await response!.json() };
};

const body = (patch: Record<string, unknown> = {}) => ({
  roomId: 2,
  date: addDays(TODAY, 1),
  startTime: "14:00",
  endTime: "16:00",
  purpose: "Latihan tari",
  jemaatId: 4,
  ...patch,
});

describe("POST /loan-room", () => {
  test("bersebelahan boleh; tanpa bapelId = pribadi dengan seri 0000", async () => {
    const created = await call("POST", "/loan-room", body());

    expect(created.status).toBe(201);
    expect(created.body.message).toBe("Berhasil Membuat Peminjaman");
    expect(created.body.data.bapel).toBeNull();
    expect(created.body.data.code).toMatch(/^LR_0002_0000-\d{4}-\d{4}$/);
  });

  test("bentrok peminjaman/ibadah = 409 issues startTime dengan pesan yang menyebut jenisnya", async () => {
    const loan = await call(
      "POST",
      "/loan-room",
      body({ startTime: "11:00", endTime: "13:00" }),
    );

    expect(loan.status).toBe(409);
    expect(loan.body.issues).toEqual([
      { path: "startTime", message: loan.body.error },
    ]);
    expect(loan.body.error).toBe(
      "Ruang Sudah Dipakai Peminjaman Rapat pengurus Komisi Wanita Pukul 10.00–12.00",
    );

    const ibadah = await call(
      "POST",
      "/loan-room",
      body({ roomId: 1, date: TODAY, startTime: "08:30", endTime: "10:00" }),
    );

    expect(ibadah.status).toBe(409);
    expect(ibadah.body.error).toMatch(/^Ruang Sudah Dipakai Ibadah /);
  });

  test("urutan galat: zod, jemaat, ruang, ruang nonaktif, bapel", async () => {
    expect((await call("POST", "/loan-room", {})).body.issues[0]).toEqual({
      path: "date",
      message: "Mohon Lengkapi Tanggal Pemakaian",
    });
    expect(
      (await call("POST", "/loan-room", body({ endTime: "13:00" }))).body.error,
    ).toBe("Jam Selesai harus setelah Jam Mulai Pemakaian");
    expect(
      (await call("POST", "/loan-room", body({ jemaatId: 999, roomId: 999 })))
        .body.issues,
    ).toEqual([{ path: "jemaatId", message: "Jemaat Tidak Ditemukan" }]);
    expect(
      (await call("POST", "/loan-room", body({ roomId: 6 }))).body.issues,
    ).toEqual([{ path: "roomId", message: "Ruang Tidak Ditemukan" }]);

    const inactive = await call("POST", "/loan-room", body({ roomId: 5 }));

    expect(inactive.status).toBe(400);
    expect(inactive.body.issues).toEqual([
      { path: "roomId", message: "Ruang Tidak Aktif" },
    ]);
    expect(
      (await call("POST", "/loan-room", body({ bapelId: 99 }))).body.issues,
    ).toEqual([
      { path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" },
    ]);
  });
});

describe("PUT dan DELETE /loan-room/:code", () => {
  test("PUT tanpa mengubah jam tidak bentrok dengan dirinya; kode tidak ada = 404 sesudah zod", async () => {
    const own = LOAN.find((row) => row.purpose === "Kelas katekisasi")!;
    const updated = await call("PUT", `/loan-room/${own.code}`, {
      roomId: own.roomId,
      date: own.date,
      startTime: own.startTime,
      endTime: own.endTime,
      purpose: "Kelas katekisasi (revisi)",
      jemaatId: own.jemaatId,
      bapelId: own.bapelId,
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.code).toBe(own.code);
    expect((await call("PUT", "/loan-room/NOPE", {})).status).toBe(400);
    expect((await call("PUT", "/loan-room/NOPE", body())).status).toBe(404);
  });

  test("PUT pada ruang yang kemudian nonaktif tetap boleh bila ruang tidak berubah", async () => {
    await call("GET", "/loan-room");
    const inactive = LOAN.find((row) => row.roomId === 5)!;
    const updated = await call("PUT", `/loan-room/${inactive.code}`, {
      roomId: 5,
      date: inactive.date,
      startTime: inactive.startTime,
      endTime: "18:00",
      purpose: inactive.purpose,
      jemaatId: inactive.jemaatId,
    });

    expect(updated.status).toBe(200);
  });

  test("DELETE hapus lunak: jamnya langsung bebas", async () => {
    const target = LOAN.find((row) => row.purpose === "Konseling pranikah")!;

    expect((await call("DELETE", `/loan-room/${target.code}`)).status).toBe(
      200,
    );
    expect(target.deletedAt).not.toBeNull();
    expect(
      (
        await call(
          "POST",
          "/loan-room",
          body({
            roomId: 4,
            date: target.date,
            startTime: "10:00",
            endTime: "12:00",
          }),
        )
      ).status,
    ).toBe(201);
  });
});

describe("booking, check, batch", () => {
  test("booking: parameter wajib 400, kosong 404", async () => {
    expect((await call("GET", "/loan-room/booking")).status).toBe(400);
    expect(
      (
        await call(
          "GET",
          `/loan-room/booking?roomId=3&date=${addDays(TODAY, 200)}`,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await call(
          "GET",
          `/loan-room/booking?roomId=2&date=${addDays(TODAY, 1)}`,
        )
      ).body.data[0],
    ).toMatchObject({ kind: "LOAN", startTime: "10:00", endTime: "12:00" });
  });

  test("check: bentrok per tanggal urut dates; butuh CREATE", async () => {
    const dates = [addDays(TODAY, 7), addDays(TODAY, 8)];
    const checked = await call("POST", "/loan-room/check", {
      roomId: 2,
      startTime: "19:00",
      endTime: "21:00",
      dates,
    });

    expect(checked.body.data.map((row: { date: string }) => row.date)).toEqual(
      dates,
    );
    expect(checked.body.data[0].clashes[0]).toMatchObject({ kind: "LOAN" });
    expect(checked.body.data[1].clashes).toEqual([]);
    expect(
      (await call("POST", "/loan-room/check", { dates }, [MENU.RUANG])).status,
    ).toBe(403);
  });

  test("batch: semua atau tidak; bentrok antar-baris dan dengan DB = 400 per baris", async () => {
    const before = LOAN.length;
    const rows = [
      body({ date: addDays(TODAY, 40), startTime: "08:00", endTime: "09:00" }),
      body({ date: addDays(TODAY, 40), startTime: "08:30", endTime: "09:30" }),
      body({ date: addDays(TODAY, 1), startTime: "11:00", endTime: "12:30" }),
    ];
    const failed = await call("POST", "/loan-room/batch", { rows });

    expect(failed.status).toBe(400);
    expect(failed.body.issues).toEqual([
      { path: "rows.1.startTime", message: "Bentrok Dengan Baris 1" },
      {
        path: "rows.2.startTime",
        message:
          "Ruang Sudah Dipakai Peminjaman Rapat pengurus Komisi Wanita Pukul 10.00–12.00",
      },
    ]);
    expect(LOAN.length).toBe(before);
    expect(
      (await call("POST", "/loan-room/batch", { rows: [] })).body.issues,
    ).toEqual([{ path: "rows", message: "Mohon Lengkapi Tanggal Peminjaman" }]);

    const saved = await call("POST", "/loan-room/batch", {
      rows: [
        rows[0],
        body({
          date: addDays(TODAY, 47),
          startTime: "08:00",
          endTime: "09:00",
        }),
      ],
    });

    expect(saved.status).toBe(201);
    expect(saved.body.message).toBe("Berhasil Membuat 2 Peminjaman");
    expect(saved.body.data.codes).toHaveLength(2);
  });
});

describe("GET /loan-room (daftar, juga dibaca Beranda)", () => {
  test("startDate satu sisi = mulai tanggal itu, urut tanggal lalu jam", async () => {
    const { body } = await call(
      "GET",
      `/loan-room?startDate=${TODAY}&limit=100`,
    );
    const keys = body.data.map(
      (row: { date: string; startTime: string }) =>
        `${row.date}${row.startTime}`,
    );

    expect(body.data.every((row: { date: string }) => row.date >= TODAY)).toBe(
      true,
    );
    expect(keys).toEqual([...keys].sort());
  });

  test("baris tanpa id, tanpa status; pribadi = bapel null", async () => {
    const { body } = await call("GET", "/loan-room?filter=pemberkatan");

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).not.toHaveProperty("id");
    expect(body.data[0]).not.toHaveProperty("status");
    expect(body.data[0].bapel).toBeNull();
  });

  test("tanpa VIEW = 403", async () => {
    expect(
      (await call("GET", "/loan-room", undefined, [MENU.RUANG])).status,
    ).toBe(403);
  });
});
