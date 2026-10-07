import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { keepDigits } from "@/lib/number";

import {
  EMPTY_PELAYAN_FORM,
  futureSlotLines,
  futureSlotsTitle,
  pelayanFormSchema,
  serverFieldError,
  toPelayanForm,
  toPelayanPayload,
  tugasOf,
  withFieldMessages,
  type PelayanFormValues,
} from "./model";
import type { FutureSlot, PelayanDetail } from "./types";

const INDIVIDUAL: PelayanFormValues = {
  ...EMPTY_PELAYAN_FORM,
  jemaatId: "2",
  bapelId: "1",
  rolePelayan: ["2", "4"],
  musikSkill: ["1"],
};

const GROUP: PelayanFormValues = {
  ...EMPTY_PELAYAN_FORM,
  typePelayan: "GROUP",
  name: "  paduan  suara efrata ",
  phone: "081234567890",
  bapelId: "1",
  rolePelayan: ["4"],
  members: [
    { id: "9", code: "JMT-0009", name: "Immanuel Saragih" },
    { id: "10", code: "", name: "Josephine Tanuwijaya" },
  ],
};

const errorsOf = (values: PelayanFormValues) => {
  const result = pelayanFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

describe("skema per jenis", () => {
  test("perorangan lengkap lolos; tanpa jemaat, bapel, dan tugas ditolak", () => {
    expect(errorsOf(INDIVIDUAL)).toEqual({});
    expect(errorsOf(EMPTY_PELAYAN_FORM)).toEqual({
      jemaatId: "Pilih jemaat yang melayani.",
      bapelId: "Pilih badan pelayanan.",
      rolePelayan: "Pilih minimal satu tugas.",
    });
  });

  test("perorangan tidak memeriksa nama, HP, anggota; kelompok tidak memeriksa jemaat", () => {
    expect(errorsOf({ ...INDIVIDUAL, phone: "abc" })).toEqual({});
    expect(errorsOf(GROUP)).toEqual({});
  });

  test("kelompok tanpa nama, HP, dan anggota ditolak dengan pesan per field", () => {
    expect(errorsOf({ ...GROUP, name: "  ", phone: "", members: [] })).toEqual({
      name: "Isi nama kelompok, mis. Paduan Suara Efrata.",
      phone: "Isi nomor HP kontak kelompok.",
      members: "Tambahkan minimal satu anggota.",
    });
  });

  test("HP bukan digit dan lebih dari 12 angka; nama lebih dari 50", () => {
    expect(errorsOf({ ...GROUP, phone: "0812-345" }).phone).toBe(
      "Nomor HP hanya angka.",
    );
    expect(errorsOf({ ...GROUP, phone: "0812345678901" }).phone).toBe(
      "Nomor HP maksimal 12 angka.",
    );
    expect(errorsOf({ ...GROUP, name: "a".repeat(51) }).name).toBe(
      "Nama kelompok maksimal 50 karakter.",
    );
  });

  test("kelompok dengan dua tugas ditolak walau UI tidak mengizinkannya", () => {
    expect(errorsOf({ ...GROUP, rolePelayan: ["4", "2"] }).rolePelayan).toBe(
      "Kelompok hanya memegang satu tugas.",
    );
  });

  test("HP ditempel dengan tanda hubung jadi digit saja, paling banyak 12", () => {
    expect(keepDigits("0812-3456", 12)).toBe("08123456");
    expect(keepDigits("0812-3456-7890-11", 12)).toBe("081234567890");
  });
});

describe("payload", () => {
  test("perorangan: semua kunci ada, nama/HP null, anggota [], isPemusik dari alat", () => {
    expect(toPelayanPayload(INDIVIDUAL)).toEqual({
      typePelayan: "INDIVIDUAL",
      bapelId: 1,
      jemaatId: 2,
      name: null,
      phone: null,
      members: [],
      rolePelayan: [2, 4],
      isPemusik: true,
      musikSkill: [1],
      status: true,
    });
    expect(toPelayanPayload({ ...INDIVIDUAL, musikSkill: [] }).isPemusik).toBe(
      false,
    );
  });

  test("kelompok: jemaatId null, nama dinormalkan, anggota berupa id", () => {
    expect(toPelayanPayload({ ...GROUP, status: "false" })).toEqual({
      typePelayan: "GROUP",
      bapelId: 1,
      jemaatId: null,
      name: "Paduan Suara Efrata",
      phone: "081234567890",
      members: [9, 10],
      rolePelayan: [4],
      isPemusik: false,
      musikSkill: [],
      status: false,
    });
  });

  test("ubah: form dari detail mengirim ulang typePelayan dan jemaatId tersimpan", () => {
    const detail: PelayanDetail = {
      code: "PLYN_0002-0003",
      typePelayan: "INDIVIDUAL",
      jemaatId: "3",
      name: null,
      phone: null,
      bapelId: "2",
      rolePelayan: ["2"],
      members: [],
      musikSkill: ["2"],
      status: true,
      jemaat: { id: 3, code: "JMT-0003", name: "Christian Wijaya" },
      memberList: [],
    };

    const payload = toPelayanPayload({
      ...toPelayanForm(detail),
      bapelId: "1",
    });

    expect(payload.typePelayan).toBe("INDIVIDUAL");
    expect(payload.jemaatId).toBe(3);
    expect(payload.bapelId).toBe(1);
  });
});

describe("pesan server ke field", () => {
  const TAKEN =
    "Jemaat Tersebut Sudah Terdaftar Sebagai Pelayan di Majelis Jemaat";

  test("sudah terdaftar: jemaat saat tambah, badan pelayanan saat ubah", () => {
    const message =
      "Jemaat ini sudah terdaftar sebagai pelayan di Majelis Jemaat. Pilih badan pelayanan lain.";

    expect(serverFieldError(TAKEN, false)).toEqual({
      field: "jemaatId",
      message,
    });
    expect(serverFieldError(TAKEN, true)).toEqual({
      field: "bapelId",
      message,
    });
  });

  test.each([
    ["Nama Group Tersebut Sudah Tersedia", "name"],
    ["Bapel Tidak Ditemukan", "bapelId"],
    ["Bapel tidak tersedia", "bapelId"],
    ["Role Pelayan dengan ID 9 Tidak Ditemukan", "rolePelayan"],
    ["Skill Musik dengan ID 9 Tidak Ditemukan", "musikSkill"],
    ["Jemaat Tidak Ditemukan", "jemaatId"],
    [
      "Jemaat Tersebut Tidak Aktif dan Tidak Dapat Didaftarkan Sebagai Pelayan",
      "jemaatId",
    ],
    ["Anggota Group dengan Jemaat ID 99 Tidak Ditemukan", "members"],
    ["Anggota Group Hanna Simorangkir Bukan Jemaat Aktif", "members"],
    [
      "Hanna Simorangkir sudah terjadwal di Komisi Pemuda pada 4 Oktober 2026 pukul 17:00 - 19:00, bersamaan dengan Band Pemuda di Pelayan Ibadah Pemuda (JDL_0002-2026-0001). Silakan pilih anggota lain atau ubah jadwal tersebut",
      "members",
    ],
  ])("%s → %s", (message, field) => {
    expect<string | undefined>(serverFieldError(message, false)?.field).toBe(
      field,
    );
  });

  test("pesan lain tidak dipetakan (jadi galat form)", () => {
    expect(serverFieldError("Kesalahan server.", false)).toBeNull();
  });

  test("issues[] berpath tetap di path-nya, pesannya diganti yang ramah", () => {
    const error = withFieldMessages(
      new FetchError(400, TAKEN, [{ path: "bapelId", message: TAKEN }]),
      true,
    ) as FetchError;

    expect(error.issues).toEqual([
      {
        path: "bapelId",
        message:
          "Jemaat ini sudah terdaftar sebagai pelayan di Majelis Jemaat. Pilih badan pelayanan lain.",
      },
    ]);
  });
});

const slot = (day: number, name: string): FutureSlot => ({
  code: `JDL_0001-2026-000${day}`,
  name,
  date: `2026-10-0${day}`,
  startTime: "07:30",
  endTime: "10:00",
  bapel: { name: "Majelis Jemaat" },
});

describe("peringatan nonaktif", () => {
  test("judul menyebut nama dan jumlah jadwal", () => {
    expect(futureSlotsTitle("Bethari Ayu Kusuma", [slot(4, "Minggu I")])).toBe(
      "Bethari Ayu Kusuma masih terjadwal di 1 jadwal",
    );
  });

  test("paling banyak 3 jadwal, lalu 'dan n lainnya', lalu arahan", () => {
    expect(futureSlotLines([slot(4, "Minggu I")])).toEqual([
      "4 Okt 2026 · Minggu I",
      "Ganti petugasnya di Jadwal Pelayan.",
    ]);
    expect(
      futureSlotLines([
        slot(1, "A"),
        slot(2, "B"),
        slot(3, "C"),
        slot(4, "D"),
        slot(5, "E"),
      ]),
    ).toEqual([
      "1 Okt 2026 · A",
      "2 Okt 2026 · B",
      "3 Okt 2026 · C",
      "dan 2 lainnya",
      "Ganti petugasnya di Jadwal Pelayan.",
    ]);
  });
});

test("tugas: nama tugas, lalu alat bila ada", () => {
  expect(tugasOf({ role: ["Pemusik"], musikSkill: ["Gitar", "Bass"] })).toBe(
    "Pemusik · Gitar, Bass",
  );
  expect(tugasOf({ role: ["Liturgis", "Singer"], musikSkill: [] })).toBe(
    "Liturgis, Singer",
  );
});
