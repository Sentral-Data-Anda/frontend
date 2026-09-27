import { describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "../../../src/lib/date";
import type { MockAction } from "../kit";

import { ibadahMock } from "./ibadah";
import { keluargaMock } from "./keluarga";
import { tipeIbadahMock } from "./tipe-ibadah";

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
  placeType: string;
  placeName: string | null;
  address?: string | null;
  hostKeluarga: { id: number; name: string } | null;
  zoneChurch: { id: number; name: string } | null;
  lastHostedDate?: string | null;
  id: number;
  name: string;
};

const TODAY = todayJakarta();

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
  handler = ibadahMock,
) => {
  const url = new URL(input, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = (await handler({
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
  placeType: "GEREJA",
  hostKeluargaId: null,
  placeName: null,
  address: null,
  zoneChurchId: null,
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
      "placeType",
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
      placeType: "GEREJA",
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

const onType = async (method: string, path: string, body: unknown) => {
  const url = new URL(path, "http://mock.test");
  const response = (await tipeIbadahMock({
    request: new Request(url, { method, body: JSON.stringify(body) }),
    url,
    path: url.pathname,
    method,
    can: () => true,
    isAdmin: true,
    sessionCode: "test",
  })) as Response;

  return (await response.json()) as { data: { id: number; code: string } };
};

describe("tipe dibaca dari state Tipe Ibadah", () => {
  test("tipe baru bisa dipakai; sesudah dinonaktifkan ditolak 400", async () => {
    const { data: type } = await onType("POST", "/type-ibadah", {
      name: "Ibadah Syukur Keluarga",
    });
    const body = { ...BODY, typeIbadahId: type.id, date: addDays(TODAY, 50) };

    const created = await onCall("POST", "/ibadah", body);
    expect(created.status).toBe(201);
    expect(created.body.data.code).toMatch(
      new RegExp(`^IBD_${type.code.split("-")[1]}-`),
    );

    await onType("PUT", `/type-ibadah/${type.code}`, {
      name: "Ibadah Syukur Keluarga",
      isActive: false,
    });
    const refused = await onCall("POST", "/ibadah", {
      ...body,
      startTime: "10:00",
      endTime: null,
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error).toBe(
      "Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain",
    );
  });

  test("ganti nama tipe tampil di daftar ibadah", async () => {
    await onType("PUT", "/type-ibadah/TYP_IBD-0004", {
      name: "Ibadah Remaja",
      isActive: true,
    });
    const { body } = await onCall("GET", "/ibadah?typeIbadahId=4&limit=100");

    expect(
      body.data.every((row) => row.typeIbadah.name === "Ibadah Remaja"),
    ).toBe(true);
    expect(
      (await onCall("GET", "/ibadah?filter=remaja&limit=100")).body.totalData,
    ).toBe(body.totalData);

    await onType("PUT", "/type-ibadah/TYP_IBD-0004", {
      name: "Ibadah Pemuda",
      isActive: true,
    });
  });
});

const THURSDAY = lastWeekday(4);

const HOME = {
  ...BODY,
  typeIbadahId: 6,
  date: addDays(TODAY, 60),
  startTime: "19:00",
  endTime: null,
  placeType: "RUMAH_JEMAAT",
  hostKeluargaId: 1,
  address: "Jl. Cijerah No. 1",
  zoneChurchId: 1,
};

describe("tempat ibadah", () => {
  test("daftar tanpa alamat; detail membawa alamat, tuan rumah, dan wilayah", async () => {
    const { body } = await onCall(
      "GET",
      `/ibadah?date=${THURSDAY}&zoneChurchId=1&limit=100`,
    );
    const [row] = body.data;

    expect(body.data).toHaveLength(1);
    expect(row).toMatchObject({
      placeType: "RUMAH_JEMAAT",
      zoneChurch: { id: 1, name: "Wilayah I" },
    });
    expect("address" in row).toBe(false);

    const detail = await onCall("GET", `/ibadah/${row.code}`);
    expect(detail.body.data.address).toMatch(/^Jl\./);
    expect(detail.body.data.hostKeluarga?.name).toBe(row.hostKeluarga?.name);
  });

  test("filter: nama tempat, nama tuan rumah, tuan rumah terhapus tetap terbaca", async () => {
    const villa = await onCall("GET", "/ibadah?filter=ciater");
    expect(villa.body.data.map((row) => row.placeName)).toEqual([
      "Villa Ciater",
    ]);

    const deleted = await onCall("GET", "/ibadah?filter=lumbantobing");
    expect(deleted.body.data[0].hostKeluarga).toMatchObject({
      id: 99,
      name: "Keluarga Lumbantobing",
    });

    const byHost = await onCall("GET", "/ibadah?hostKeluargaId=99");
    expect(byHost.body.totalData).toBe(1);
  });

  test("aturan per tipe tempat: wajib dan terlarang", async () => {
    const missing = await onCall("POST", "/ibadah", {
      ...BODY,
      placeType: undefined,
    });
    expect(missing.body.error).toBe("Mohon Lengkapi Tempat Ibadah");

    const home = await onCall("POST", "/ibadah", {
      ...HOME,
      hostKeluargaId: null,
      address: "  ",
      roomId: 1,
    });
    expect(home.body.issues).toEqual([
      {
        path: "hostKeluargaId",
        message: "Mohon Lengkapi Keluarga Tuan Rumah",
      },
      { path: "address", message: "Mohon Lengkapi Alamat Ibadah" },
      { path: "roomId", message: "Ruangan Hanya Diisi Untuk Ibadah di Gereja" },
    ]);

    const church = await onCall("POST", "/ibadah", {
      ...BODY,
      address: "Jl. A",
      placeName: "Aula",
    });
    expect(church.body.issues?.map((issue) => issue.message)).toEqual([
      "Nama Tempat Hanya Diisi Untuk Ibadah di Tempat Lainnya",
      "Alamat Tidak Diisi Untuk Ibadah di Gereja",
    ]);

    const other = await onCall("POST", "/ibadah", {
      ...BODY,
      placeType: "LAINNYA",
    });
    expect(other.body.error).toBe("Mohon Lengkapi Nama Tempat");
  });

  test("relasi tempat membawa issues; duplikat per wilayah", async () => {
    const host = await onCall("POST", "/ibadah", {
      ...HOME,
      hostKeluargaId: 999,
    });
    expect(host.status).toBe(404);
    expect(host.body.issues).toEqual([
      {
        path: "hostKeluargaId",
        message: "Keluarga Tuan Rumah Tidak Ditemukan",
      },
    ]);

    const zone = await onCall("POST", "/ibadah", { ...HOME, zoneChurchId: 99 });
    expect(zone.body.error).toBe("Wilayah Gereja Tidak Ditemukan");

    const inactive = await onCall("POST", "/ibadah", {
      ...HOME,
      zoneChurchId: 5,
    });
    expect(inactive.status).toBe(400);
    expect(inactive.body.issues?.[0].path).toBe("zoneChurchId");

    expect((await onCall("POST", "/ibadah", HOME)).status).toBe(201);
    const duplicate = await onCall("POST", "/ibadah", HOME);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.issues?.[0].path).toBe("startTime");
    expect(
      (
        await onCall("POST", "/ibadah", {
          ...HOME,
          zoneChurchId: 2,
          hostKeluargaId: 2,
        })
      ).status,
    ).toBe(201);
  });
});

describe("saran tuan rumah", () => {
  test("hanya CREATE; query wajib", async () => {
    const viewOnly = await onCall(
      "GET",
      "/ibadah/saran-tuan-rumah?typeIbadahId=6&zoneChurchId=1",
      undefined,
      (_slug, action) => action === "VIEW",
    );
    expect(viewOnly.status).toBe(403);

    const invalid = await onCall(
      "GET",
      "/ibadah/saran-tuan-rumah?typeIbadahId=6&zoneChurchId=x",
    );
    expect(invalid.body.error).toBe("Mohon Lengkapi Wilayah");
  });

  test("keluarga layak: belum pernah dulu, lalu tertua; yang dijadwalkan di bawah", async () => {
    const { body } = await onCall(
      "GET",
      "/ibadah/saran-tuan-rumah?typeIbadahId=6&zoneChurchId=2",
    );
    const dates = body.data.map((row) => row.lastHostedDate ?? "");

    expect(body.data.map((row) => row.id).sort((a, b) => a - b)).toEqual([
      2, 7, 11, 14, 19, 24,
    ]);
    expect(dates[0]).toBe("");
    expect(dates.slice(1)).toEqual([...dates.slice(1)].sort());
    expect((dates.at(-1) ?? "").slice(0, 10) >= TODAY).toBe(true);
  });

  test("wilayah tanpa keluarga layak: 404", async () => {
    const { status, body } = await onCall(
      "GET",
      "/ibadah/saran-tuan-rumah?typeIbadahId=6&zoneChurchId=3",
    );

    expect(status).toBe(404);
    expect(body.error).toBe(
      "Tidak Ada Keluarga Yang Dapat Menjadi Tuan Rumah di Wilayah Ini",
    );
  });
});

describe("keluarga untuk ibadah", () => {
  test("alamat hanya IBADAH CREATE; wilayah dengan status aktif; 404", async () => {
    const onAlamat = (id: string, can = () => true) =>
      onCall("GET", `/ddl/keluarga/${id}/alamat`, undefined, can, keluargaMock);

    expect((await onAlamat("1", () => false)).status).toBe(403);
    expect((await onAlamat("1")).body.data).toMatchObject({
      id: 1,
      zoneChurch: { id: 1, name: "Wilayah I", isActive: true },
    });
    expect((await onAlamat("5")).body.data).toMatchObject({ zoneChurch: null });
    expect((await onAlamat("999")).body.error).toBe("Keluarga Tidak Ditemukan");
  });

  test("hapus keluarga tanpa anggota yang dijadwalkan menjadi tuan rumah: 400 dengan tanggal", async () => {
    const date = addDays(TODAY, 70);
    const created = await onCall("POST", "/ibadah", {
      ...HOME,
      date,
      hostKeluargaId: 6,
      zoneChurchId: null,
    });
    expect(created.status).toBe(201);

    const { status, body } = await onCall(
      "DELETE",
      "/keluarga/KK-0006",
      undefined,
      () => true,
      keluargaMock,
    );

    expect(status).toBe(400);
    expect(body.error).toMatch(
      /^Keluarga Masih Dijadwalkan Menjadi Tuan Rumah pada \d{1,2} \w+ \d{4}$/,
    );
  });
});
