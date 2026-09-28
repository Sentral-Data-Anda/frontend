import { afterEach, describe, expect, test } from "bun:test";

import type { MockAction } from "../kit";
import {
  JADWAL_PELAYAN,
  NEXT_SUNDAY,
  TEMPLATE_JADWAL,
} from "../pelayanan-store";

import { jadwalPelayanMock } from "./jadwal-pelayan";

const SNAPSHOT = {
  jadwal: structuredClone(JADWAL_PELAYAN),
  template: structuredClone(TEMPLATE_JADWAL),
};

afterEach(() => {
  JADWAL_PELAYAN.splice(0, Infinity, ...structuredClone(SNAPSHOT.jadwal));
  TEMPLATE_JADWAL.splice(0, Infinity, ...structuredClone(SNAPSHOT.template));
  delete process.env.MOCK_JADWAL_INACTIVE;
});

type Body = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data: never;
};

const onCall = async (
  input: string,
  init: { method?: string; body?: unknown } = {},
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const method = init.method ?? "GET";
  const response = (await jadwalPelayanMock({
    request: new Request(url, {
      method,
      body: init.body ? JSON.stringify(init.body) : undefined,
    }),
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Body };
};

const codeOf = (id: number) =>
  JADWAL_PELAYAN.find((row) => row.id === id)?.code ?? "";

const window = (startTime: string, endTime: string) =>
  `date=${NEXT_SUNDAY}&startTime=${startTime}&endTime=${endTime}`;

const body = (overrides: Record<string, unknown> = {}) => ({
  bapelId: 2,
  date: NEXT_SUNDAY,
  name: "Persekutuan Pemuda Siang",
  startTime: "12:00",
  endTime: "13:00",
  makeTemplate: false,
  detail: [
    {
      order: 1,
      rolePelayanId: 3,
      pelayanId: 8,
      musikSkillId: null,
      groupPelayanId: null,
    },
  ],
  ...overrides,
});

describe("daftar dan detail", () => {
  test("urut tanggal lalu jam menurun; baris membawa bapel, slot urut, dan ibadah", async () => {
    const { body: list } = await onCall("/jadwal-pelayan?limit=100");
    const rows = list.data as unknown as {
      code: string;
      startTime: string;
      bapel: { name: string };
      detail: { order: number; pelayan: string }[];
      ibadah: { typeIbadah: { name: string } }[];
    }[];

    expect(rows.map((row) => row.startTime)).toEqual([
      "17:00",
      "09:00",
      "07:30",
      "07:30",
    ]);
    const first = rows.find((row) => row.code === codeOf(1));

    expect(first?.bapel.name).toBe("Majelis Jemaat");
    expect(first?.detail.map((slot) => slot.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(first?.detail[2].pelayan).toBe("Bethari Ayu Kusuma (Keyboard)");
    expect(first?.detail[7].pelayan).toBe("");
    expect(first?.ibadah[0]?.typeIbadah.name).toBe("Ibadah Minggu I");
  });

  test("filter bulan, bapel, cari; bulan salah 400", async () => {
    const month = NEXT_SUNDAY.slice(0, 7);
    const pemuda = await onCall(`/jadwal-pelayan?bapelId=2&month=${month}`);

    expect(pemuda.body.status).toBe(200);
    expect((pemuda.body.data as unknown as unknown[]).length).toBe(2);
    expect((await onCall("/jadwal-pelayan?filter=pagi")).body.status).toBe(200);
    expect((await onCall("/jadwal-pelayan?month=2026-13")).status).toBe(400);
    expect((await onCall("/jadwal-pelayan?filter=zzz")).status).toBe(404);
  });

  test("detail: nilai bersandi, nama ddl, kelompok, kosong null", async () => {
    const { body: detail } = await onCall(`/jadwal-pelayan/${codeOf(1)}`);
    const slots = (
      detail.data as unknown as {
        detail: { pelayanId: string; pelayan: unknown }[];
      }
    ).detail;

    expect(slots[2]).toMatchObject({
      pelayanId: "2-1",
      pelayan: { name: "Bethari Ayu Kusuma (Keyboard)", isActive: true },
    });
    expect(slots[4].pelayan).toMatchObject({
      value: "1-G",
      isGroup: true,
    });
    expect(slots[7].pelayan).toBeNull();
    expect((await onCall("/jadwal-pelayan/JDL_9999")).status).toBe(404);
  });
});

describe("ddl pelayan", () => {
  test("R1: Christian (Majelis) nonaktif di jadwal 2 dengan alasan; Gideon nonaktif tidak muncul; petugas sendiri tidak nonaktif dengan excludeCode", async () => {
    const path = `/ddl/pelayan?roleId=2&bapelId=1&${window("07:30", "10:00")}`;
    const { body: bare } = await onCall(path);
    const rows = bare.data as unknown as {
      code: string;
      name: string;
      disableServe: boolean;
      unavailableReason: string | null;
    }[];

    expect(rows.map((row) => row.name).sort()).toEqual([
      "Bethari Ayu Kusuma (Keyboard)",
      "Christian Wijaya (Bass)",
      "Christian Wijaya (Gitar)",
    ]);
    expect(rows.find((row) => row.code === "3-2")).toMatchObject({
      disableServe: true,
      unavailableReason: "Terjadwal di Komisi Pemuda 09:00–11:00",
    });
    expect(rows.find((row) => row.code === "2-1")?.disableServe).toBe(true);

    const { body: own } = await onCall(`${path}&excludeCode=${codeOf(2)}`);

    expect(
      (own.data as unknown as { code: string; disableServe: boolean }[]).find(
        (row) => row.code === "2-1",
      )?.disableServe,
    ).toBe(false);
  });

  test("R2: Band Pemuda nonaktif di jam yang bersinggungan dengan anggotanya", async () => {
    const { body: ddl } = await onCall(
      `/ddl/pelayan?roleId=2&bapelId=2&${window("09:30", "10:30")}`,
    );

    expect(
      (ddl.data as unknown as { code: string; disableServe: boolean }[]).find(
        (row) => row.code === "2-G",
      )?.disableServe,
    ).toBe(true);
  });

  test("tanpa jam lengkap tidak ada yang nonaktif; tanpa izin 403", async () => {
    const { body: ddl } = await onCall("/ddl/pelayan?roleId=2&bapelId=1");

    expect(
      (ddl.data as unknown as { disableServe: boolean }[]).every(
        (row) => !row.disableServe,
      ),
    ).toBe(true);
    expect(
      (await onCall("/ddl/pelayan?roleId=2", {}, () => false)).status,
    ).toBe(403);
  });

  test("ddl jadwal-pelayan per tanggal", async () => {
    const { body: ddl } = await onCall(
      `/ddl/jadwal-pelayan?date=${NEXT_SUNDAY}`,
    );

    expect(
      (ddl.data as unknown as { startTime: string }[]).map(
        (row) => row.startTime,
      ),
    ).toEqual(["07:30", "09:00", "17:00"]);
  });
});

describe("simpan dan hapus", () => {
  test("POST 201, kode per bapel dan tahun; makeTemplate menambah template, kembar 409 di name", async () => {
    const created = await onCall("/jadwal-pelayan", {
      method: "POST",
      body: body({ makeTemplate: true }),
    });

    expect(created.status).toBe(201);
    expect((created.body.data as unknown as { code: string }).code).toMatch(
      new RegExp(`^JDL_0002-${NEXT_SUNDAY.slice(0, 4)}-\\d{4}$`),
    );
    expect(TEMPLATE_JADWAL.at(-1)?.name).toBe("Persekutuan Pemuda Siang");

    const twin = await onCall("/jadwal-pelayan", {
      method: "POST",
      body: body({ makeTemplate: true, startTime: "20:00", endTime: "21:00" }),
    });

    expect(twin.status).toBe(409);
    expect(twin.body.issues?.[0].path).toBe("name");
  });

  test("409 bentrok per jemaat (R1) menyebut orang dan jadwalnya, tanpa field", async () => {
    const clash = await onCall("/jadwal-pelayan", {
      method: "POST",
      body: body({
        startTime: "10:30",
        endTime: "12:00",
        detail: [
          {
            order: 1,
            rolePelayanId: 2,
            pelayanId: 9,
            musikSkillId: 2,
            groupPelayanId: null,
          },
        ],
      }),
    });

    expect(clash.status).toBe(409);
    expect(clash.body.error).toMatch(
      /^Christian Wijaya sudah terjadwal di Komisi Pemuda pada \d{1,2} \w+ \d{4} pukul 09:00 - 11:00/,
    );
    expect(clash.body.issues).toBeUndefined();
  });

  test("zod dan R3 per slot", async () => {
    const invalid = await onCall("/jadwal-pelayan", {
      method: "POST",
      body: body({ name: "ab", detail: [] }),
    });

    expect(invalid.body.issues?.map((issue) => issue.path)).toEqual([
      "name",
      "detail",
    ]);

    const wrongRole = await onCall("/jadwal-pelayan", {
      method: "POST",
      body: body({
        detail: [
          {
            order: 1,
            rolePelayanId: 1,
            pelayanId: 8,
            musikSkillId: null,
            groupPelayanId: null,
          },
        ],
      }),
    });

    expect(wrongRole.body.error).toBe(
      "Hanna Simorangkir Tidak Memegang Role Liturgis",
    );
  });

  test("slot tersimpan yang kini nonaktif tetap bisa disimpan bila tidak berubah; diganti lalu dikembalikan ditolak", async () => {
    process.env.MOCK_JADWAL_INACTIVE = "1";
    const code = codeOf(2);
    const saved = JADWAL_PELAYAN.find((row) => row.id === 2);
    const detail = saved?.detail.map((slot) => ({ ...slot })) ?? [];
    const put = (slots: typeof detail) =>
      onCall(`/jadwal-pelayan/${code}`, {
        method: "PUT",
        body: {
          ...body(),
          bapelId: 1,
          name: "Pelayan Ibadah Minggu I",
          startTime: "07:30",
          endTime: "10:00",
          detail: slots,
        },
      });

    const detailBody = await onCall(`/jadwal-pelayan/${code}`);

    expect(
      (
        detailBody.body.data as unknown as {
          detail: { pelayan: { isActive: boolean } | null }[];
        }
      ).detail[5].pelayan?.isActive,
    ).toBe(false);
    expect((await put(detail)).status).toBe(200);

    JADWAL_PELAYAN.find((row) => row.id === 2)?.detail.splice(5, 1, {
      ...detail[5],
      pelayanId: null,
    });

    const back = await put(detail);

    expect(back.status).toBe(400);
    expect(back.body.error).toBe(
      "Kevin Nainggolan Sedang Nonaktif Sebagai Pelayan",
    );
  });

  test("jadwal yang ditaut ibadah: hapus dan geser ditolak menyebut ibadahnya", async () => {
    const code = codeOf(1);
    const removed = await onCall(`/jadwal-pelayan/${code}`, {
      method: "DELETE",
    });

    expect(removed.status).toBe(400);
    expect(removed.body.error).toMatch(
      /^Jadwal Pelayan Tidak Dapat Dihapus Karena Masih Ditautkan ke Ibadah .+ \(IBD_.+\)$/,
    );

    const saved = JADWAL_PELAYAN.find((row) => row.id === 1);
    const moved = await onCall(`/jadwal-pelayan/${code}`, {
      method: "PUT",
      body: {
        bapelId: 1,
        date: NEXT_SUNDAY,
        name: saved?.name,
        startTime: "07:30",
        endTime: "10:00",
        makeTemplate: false,
        detail: saved?.detail,
      },
    });

    expect(moved.status).toBe(400);
    expect(moved.body.issues?.[0].path).toBe("date");

    const free = await onCall(`/jadwal-pelayan/${codeOf(4)}`, {
      method: "DELETE",
    });

    expect(free.status).toBe(200);
  });
});
