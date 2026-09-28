import { afterAll, describe, expect, test } from "bun:test";

import type { MockAction } from "../kit";
import { GROUP_PELAYAN, PELAYAN } from "../pelayanan-store";

import { pelayanMock } from "./pelayan";

const seed = structuredClone({ PELAYAN, GROUP_PELAYAN });

afterAll(() => {
  PELAYAN.splice(0, PELAYAN.length, ...seed.PELAYAN);
  GROUP_PELAYAN.splice(0, GROUP_PELAYAN.length, ...seed.GROUP_PELAYAN);
});

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
  futureSlots?: { name: string; bapel: { name: string } }[];
  totalData?: number;
};

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const response = (await pelayanMock({
    request: new Request(url, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Json };
};

const namesOf = (body: Json) =>
  (body.data as { namePelayan: string }[]).map((row) => row.namePelayan);

const individual = (overrides: Record<string, unknown> = {}) => ({
  typePelayan: "INDIVIDUAL",
  bapelId: 1,
  jemaatId: 9,
  name: null,
  phone: null,
  members: [],
  rolePelayan: [1],
  isPemusik: false,
  musikSkill: [],
  status: true,
  ...overrides,
});

describe("mock GET /pelayan", () => {
  test("perorangan dan kelompok digabung, urut nama, 404 bila kosong", async () => {
    const all = await onCall("GET", "/pelayan?limit=100");

    expect(all.body.totalData).toBe(13);
    expect(namesOf(all.body).slice(0, 3)).toEqual([
      "Andreas Sitanggang",
      "Band Pemuda",
      "Bethari Ayu Kusuma",
    ]);

    const none = await onCall("GET", "/pelayan?filter=zzz");
    expect(none.status).toBe(404);
    expect(none.body.error).toBe("Pelayan Tidak Ditemukan");
  });

  test("filter kode/nama/HP/bapel, bapelId, roleId, status", async () => {
    expect(
      namesOf((await onCall("GET", "/pelayan?filter=0812987")).body),
    ).toEqual(["Band Pemuda"]);
    expect(
      namesOf((await onCall("GET", "/pelayan?bapelId=2&roleId=2")).body),
    ).toEqual(["Band Pemuda", "Christian Wijaya"]);
    expect(
      namesOf((await onCall("GET", "/pelayan?status=false")).body),
    ).toEqual(["Gideon Tampubolon"]);
  });

  test("tanpa VIEW: 403", async () => {
    expect(
      (await onCall("GET", "/pelayan", undefined, () => false)).status,
    ).toBe(403);
  });
});

describe("mock detail /pelayan/:code", () => {
  test("kelompok: memberList urut nama, kode tanpa peka huruf besar", async () => {
    const { body } = await onCall("GET", "/pelayan/gplyn_0002-0001");
    const detail = body.data as { memberList: { name: string }[] };

    expect(detail.memberList.map((member) => member.name)).toEqual([
      "Christian Wijaya",
      "Eleazar Panggabean",
      "Lidya Hutagalung",
    ]);
  });

  test("perorangan: jemaat { id, code, name }", async () => {
    const { body } = await onCall("GET", "/pelayan/PLYN_0002-0003");

    expect((body.data as { jemaat: unknown }).jemaat).toEqual({
      id: 3,
      code: "JMT-0003",
      name: "Christian Wijaya",
    });
  });
});

describe("mock simpan", () => {
  test("zod: issues[] per field, error = issue pertama", async () => {
    const { status, body } = await onCall("POST", "/pelayan", {
      typePelayan: "GROUP",
      bapelId: 1,
      rolePelayan: [1, 2],
      members: [],
      name: "",
      phone: "08-12",
    });

    expect(status).toBe(400);
    expect(body.error).toBe(
      "Group Pelayan hanya dapat memiliki satu Role Pelayan",
    );
    expect(body.issues?.map((issue) => issue.path)).toEqual([
      "rolePelayan",
      "name",
      "phone",
      "members",
    ]);
  });

  test("Andreas lagi di Majelis: 400 di jemaatId", async () => {
    const { status, body } = await onCall(
      "POST",
      "/pelayan",
      individual({ jemaatId: 1 }),
    );

    expect(status).toBe(400);
    expect(body.issues).toEqual([
      {
        path: "jemaatId",
        message:
          "Jemaat Tersebut Sudah Terdaftar Sebagai Pelayan di Majelis Jemaat",
      },
    ]);
  });

  test("Christian Pemuda pindah ke Majelis: 400 di bapelId", async () => {
    const { status, body } = await onCall(
      "PUT",
      "/pelayan/PLYN_0002-0003",
      individual({ jemaatId: 3, rolePelayan: [2] }),
    );

    expect(status).toBe(400);
    expect(body.issues?.[0].path).toBe("bapelId");
  });

  test("nama kelompok dipakai: 400 di name", async () => {
    const { body } = await onCall("POST", "/pelayan", {
      typePelayan: "GROUP",
      bapelId: 2,
      jemaatId: null,
      name: "band pemuda",
      phone: "0812",
      members: [1],
      rolePelayan: [2],
      isPemusik: false,
      musikSkill: [],
      status: true,
    });

    expect(body.error).toBe("Nama Group Tersebut Sudah Tersedia");
  });

  test("nonaktifkan Bethari: 200 dengan futureSlots jadwal Minggu depan", async () => {
    const { status, body } = await onCall(
      "PUT",
      "/pelayan/PLYN_0001-0002",
      individual({ jemaatId: 2, rolePelayan: [2, 4], status: false }),
    );

    expect(status).toBe(200);
    expect(body.futureSlots).toHaveLength(1);
    expect(body.futureSlots?.[0].bapel).toEqual({ name: "Majelis Jemaat" });

    const active = await onCall(
      "PUT",
      "/pelayan/PLYN_0001-0002",
      individual({
        jemaatId: 2,
        rolePelayan: [2, 4],
        isPemusik: true,
        musikSkill: [1],
      }),
    );
    expect(active.body.futureSlots).toEqual([]);
  });
});

describe("mock DELETE", () => {
  test("Bethari terjadwal mendatang: 400 menyarankan nonaktifkan", async () => {
    const { status, body } = await onCall("DELETE", "/pelayan/PLYN_0001-0002");

    expect(status).toBe(400);
    expect(body.error).toMatch(
      /^Pelayan Tidak Dapat Dihapus Karena Masih Terjadwal pada \d{1,2} \S+ \d{4}\. Nonaktifkan/,
    );
  });

  test("Debora: terhapus, lalu bisa didaftarkan ulang di bapel yang sama", async () => {
    expect((await onCall("DELETE", "/pelayan/PLYN_0001-0004")).status).toBe(
      200,
    );
    expect((await onCall("GET", "/pelayan/PLYN_0001-0004")).status).toBe(404);

    const again = await onCall(
      "POST",
      "/pelayan",
      individual({ jemaatId: 4, rolePelayan: [6] }),
    );

    expect(again.status).toBe(201);
    expect((again.body.data as { code: string }).code).toBe("PLYN_0001-0009");
  });
});
