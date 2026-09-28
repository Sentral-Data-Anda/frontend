import { describe, expect, test } from "bun:test";

import {
  EMPTY_JADWAL_FORM,
  jadwalFormSchema,
  monthOptions,
  slotIndexOf,
  toFormErrors,
  toJadwalCopy,
  toJadwalForm,
  toJadwalPayload,
  toPelayanOptions,
  toSlotPayload,
  toWhatsAppText,
  detailToWhatsApp,
  withSavedPelayan,
  withTemplate,
  pelayanIdOf,
  takenKeysOf,
  type JadwalFormValues,
} from "./model";
import type { JadwalPelayanDetail, PelayanOption } from "./types";

const VALID: JadwalFormValues = {
  bapelId: "1",
  date: "2026-10-04",
  startTime: "07:30",
  endTime: "10:00",
  name: "Pelayan Ibadah Minggu I",
  makeTemplate: "false",
  slots: [
    { roleId: "1", pelayan: "1-I" },
    { roleId: "2", pelayan: "3-2" },
    { roleId: "4", pelayan: "1-G" },
    { roleId: "2", pelayan: "" },
  ],
};

const errorsOf = (values: JadwalFormValues) => {
  const result = jadwalFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

const DETAIL: JadwalPelayanDetail = {
  id: 2,
  publicId: "x",
  code: "JDL_0001-2026-0002",
  name: "Pelayan Ibadah Minggu I",
  date: "2026-10-04T00:00:00.000Z",
  startTime: "07:30",
  endTime: "10:00",
  bapel: { id: 1, code: "BPL-1", name: "Majelis Jemaat" },
  detail: [
    {
      order: 3,
      rolePelayanId: "2",
      pelayanId: "2-1",
      role: { id: 2, name: "Pemusik" },
      pelayan: {
        value: "2-1",
        name: "Bethari Ayu Kusuma (Keyboard)",
        isGroup: false,
        isActive: true,
      },
    },
    {
      order: 1,
      rolePelayanId: "1",
      pelayanId: "1-I",
      role: { id: 1, name: "Liturgis" },
      pelayan: {
        value: "1-I",
        name: "Andreas Sitanggang",
        isGroup: false,
        isActive: true,
      },
    },
    {
      order: 4,
      rolePelayanId: "5",
      pelayanId: "10-I",
      role: { id: 5, name: "Multimedia" },
      pelayan: {
        value: "10-I",
        name: "Kevin Nainggolan",
        isGroup: false,
        isActive: false,
      },
    },
    {
      order: 2,
      rolePelayanId: "4",
      pelayanId: "1-G",
      role: { id: 4, name: "Singer" },
      pelayan: {
        value: "1-G",
        name: "Paduan Suara Efrata",
        isGroup: true,
        isActive: true,
      },
    },
    {
      order: 5,
      rolePelayanId: "2",
      pelayanId: "",
      role: { id: 2, name: "Pemusik" },
      pelayan: null,
    },
  ],
  ibadah: [
    {
      code: "IBD_0001-2026-0010",
      date: "2026-10-04T00:00:00.000Z",
      startTime: "07:30",
      typeIbadah: { name: "Ibadah Minggu I" },
    },
  ],
};

describe("nilai slot bersandi", () => {
  test("empat bentuk", () => {
    expect(toSlotPayload("12-I")).toEqual({
      pelayanId: 12,
      musikSkillId: null,
      groupPelayanId: null,
    });
    expect(toSlotPayload("12-5")).toEqual({
      pelayanId: 12,
      musikSkillId: 5,
      groupPelayanId: null,
    });
    expect(toSlotPayload("3-G")).toEqual({
      pelayanId: null,
      musikSkillId: null,
      groupPelayanId: 3,
    });
    expect(toSlotPayload("")).toEqual({
      pelayanId: null,
      musikSkillId: null,
      groupPelayanId: null,
    });
    expect(pelayanIdOf("12-5")).toBe(12);
    expect(pelayanIdOf("3-G")).toBeNull();
  });
});

describe("skema", () => {
  test("isian sah lolos; slot kosong boleh", () => {
    expect(errorsOf(VALID)).toEqual({});
  });

  test("wajib dan jam", () => {
    expect(errorsOf({ ...EMPTY_JADWAL_FORM, slots: [] })).toEqual({
      bapelId: "Pilih badan pelayanan.",
      date: "Tanggal wajib diisi",
      startTime: "Isi jam mulai.",
      endTime: "Isi jam selesai.",
      name: "Isi nama jadwal, mis. Pelayan Ibadah Minggu I.",
      slots: "Tambahkan minimal satu petugas.",
    });
    expect(errorsOf({ ...VALID, endTime: "07:30" })).toEqual({
      endTime: "Jam selesai harus sesudah jam mulai.",
    });
  });

  test("nama dinormalkan lalu 4–50", () => {
    expect(errorsOf({ ...VALID, name: "   " }).name).toBe(
      "Isi nama jadwal, mis. Pelayan Ibadah Minggu I.",
    );
    expect(errorsOf({ ...VALID, name: " a  b " }).name).toBe(
      "Nama jadwal minimal 4 karakter.",
    );
    expect(errorsOf({ ...VALID, name: "a".repeat(51) }).name).toBe(
      "Nama jadwal maksimal 50 karakter.",
    );
  });

  test("tugas wajib per baris; orang yang sama lintas alat dan kelompok yang sama ditolak di baris kedua", () => {
    expect(
      errorsOf({ ...VALID, slots: [{ roleId: "", pelayan: "" }] }),
    ).toEqual({ "slots.0.roleId": "Pilih tugas." });
    expect(
      errorsOf({
        ...VALID,
        slots: [
          { roleId: "2", pelayan: "3-2" },
          { roleId: "2", pelayan: "3-3" },
          { roleId: "4", pelayan: "1-G" },
          { roleId: "4", pelayan: "1-G" },
          { roleId: "1", pelayan: "1-I" },
        ],
      }),
    ).toEqual({
      "slots.1.pelayan": "Orang ini sudah mengisi tugas lain di jadwal ini.",
      "slots.3.pelayan": "Kelompok ini sudah mengisi tugas lain di jadwal ini.",
    });
  });
});

describe("payload dan detail", () => {
  test("order mengikuti urutan baris, slot kosong semua null, nama dinormalkan", () => {
    const payload = toJadwalPayload(
      { ...VALID, name: " pelayan  minggu ", makeTemplate: "true" },
      false,
    );

    expect(payload).toMatchObject({
      bapelId: 1,
      date: "2026-10-04",
      name: "Pelayan Minggu",
      makeTemplate: true,
    });
    expect(payload.detail).toEqual([
      {
        order: 1,
        rolePelayanId: 1,
        pelayanId: 1,
        musikSkillId: null,
        groupPelayanId: null,
      },
      {
        order: 2,
        rolePelayanId: 2,
        pelayanId: 3,
        musikSkillId: 2,
        groupPelayanId: null,
      },
      {
        order: 3,
        rolePelayanId: 4,
        pelayanId: null,
        musikSkillId: null,
        groupPelayanId: 1,
      },
      {
        order: 4,
        rolePelayanId: 2,
        pelayanId: null,
        musikSkillId: null,
        groupPelayanId: null,
      },
    ]);
  });

  test("PUT selalu makeTemplate false", () => {
    expect(
      toJadwalPayload({ ...VALID, makeTemplate: "true" }, true).makeTemplate,
    ).toBe(false);
  });

  test("detail tak berurutan → baris berurutan, nilai bersandi apa adanya", () => {
    expect(toJadwalForm(DETAIL)).toEqual({
      bapelId: "1",
      date: "2026-10-04",
      startTime: "07:30",
      endTime: "10:00",
      name: "Pelayan Ibadah Minggu I",
      makeTemplate: "false",
      slots: [
        { roleId: "1", pelayan: "1-I" },
        { roleId: "4", pelayan: "1-G" },
        { roleId: "2", pelayan: "2-1" },
        { roleId: "5", pelayan: "10-I" },
        { roleId: "2", pelayan: "" },
      ],
    });
  });

  test("salin: tanggal kosong, petugas nonaktif dikosongkan dan dihitung", () => {
    const copy = toJadwalCopy(DETAIL);

    expect(copy.skipped).toBe(1);
    expect(copy.values.date).toBe("");
    expect(copy.values.makeTemplate).toBe("false");
    expect(copy.values.slots[3]).toEqual({ roleId: "5", pelayan: "" });
    expect(copy.values.slots[2]).toEqual({ roleId: "2", pelayan: "2-1" });
  });

  test("template: jam dan tugas diganti, nama hanya bila kosong", () => {
    const template = {
      id: 1,
      code: "TMP",
      name: "Ibadah Minggu Pagi",
      startTime: "07:30",
      endTime: "10:00",
      detail: [
        { order: 2, rolePelayanId: 3 },
        { order: 1, rolePelayanId: 1 },
      ],
    };

    expect(withTemplate({ ...VALID, name: "" }, template)).toMatchObject({
      name: "Ibadah Minggu Pagi",
      startTime: "07:30",
      slots: [
        { roleId: "1", pelayan: "" },
        { roleId: "3", pelayan: "" },
      ],
    });
    expect(withTemplate(VALID, template).name).toBe(VALID.name);
  });
});

const ROWS: PelayanOption[] = [
  {
    typePelayan: "INDIVIDUAL",
    code: "3-2",
    name: "Christian Wijaya (Gitar)",
    bapelName: "Majelis Jemaat",
    disableServe: true,
    unavailableReason: "Terjadwal di Komisi Pemuda 09:00–11:00",
  },
  {
    typePelayan: "INDIVIDUAL",
    code: "2-1",
    name: "Bethari Ayu Kusuma (Keyboard)",
    bapelName: "Majelis Jemaat",
    disableServe: true,
    unavailableReason: null,
  },
  {
    typePelayan: "GROUP",
    code: "2-G",
    name: "Band Pemuda",
    bapelName: "Komisi Pemuda",
    disableServe: false,
    unavailableReason: null,
  },
];

describe("opsi pelayan", () => {
  test("urut label, kelompok ber-hint, disableServe → nonaktif dengan alasan atau teks umum", () => {
    expect(toPelayanOptions(ROWS, new Map())).toEqual([
      {
        value: "2-G",
        label: "Band Pemuda",
        hint: "Kelompok",
        isDisabled: undefined,
      },
      {
        value: "2-1",
        label: "Bethari Ayu Kusuma (Keyboard)",
        hint: "Tidak tersedia pada jam ini",
        isDisabled: true,
      },
      {
        value: "3-2",
        label: "Christian Wijaya (Gitar)",
        hint: "Terjadwal di Komisi Pemuda 09:00–11:00",
        isDisabled: true,
      },
    ]);
  });

  test("orang atau kelompok yang sudah mengisi baris lain nonaktif, semua alatnya", () => {
    const taken = takenKeysOf(
      [
        { roleId: "2", pelayan: "3-3" },
        { roleId: "2", pelayan: "" },
        { roleId: "2", pelayan: "2-G" },
      ],
      1,
    );

    expect(taken).toEqual(
      new Map([
        ["P3", 1],
        ["G2", 3],
      ]),
    );
    expect(
      toPelayanOptions(ROWS, taken).map((option) => [
        option.value,
        option.hint,
        option.isDisabled,
      ]),
    ).toEqual([
      ["2-G", "Sudah di petugas 3", true],
      ["2-1", "Tidak tersedia pada jam ini", true],
      ["3-2", "Sudah di petugas 1", true],
    ]);
    expect(takenKeysOf([{ roleId: "2", pelayan: "3-3" }], 0).size).toBe(0);
  });

  test("Belum diisi pertama; nilai tersimpan di luar opsi atau nonaktif tampil (nonaktif)", () => {
    const options = toPelayanOptions(ROWS, new Map());
    const kevin = {
      value: "10-I",
      name: "Kevin Nainggolan",
      isGroup: false,
      isActive: false,
    };

    expect(withSavedPelayan(options, "", undefined)[0]).toEqual({
      value: "",
      label: "Belum diisi",
    });
    expect(withSavedPelayan(options, "10-I", kevin)[1]).toEqual({
      value: "10-I",
      label: "Kevin Nainggolan (nonaktif)",
      hint: undefined,
    });
    expect(
      withSavedPelayan(options, "2-G", {
        value: "2-G",
        name: "Band Pemuda",
        isGroup: true,
        isActive: true,
      }),
    ).toHaveLength(4);
  });
});

describe("bulan", () => {
  test("15 bulan: 3 ke depan sampai 11 ke belakang", () => {
    const months = monthOptions("2026-09-28");

    expect(months).toHaveLength(15);
    expect(months[0]).toEqual({ value: "2026-12", label: "Desember 2026" });
    expect(months[3]).toEqual({ value: "2026-09", label: "September 2026" });
    expect(months.at(-1)?.value).toBe("2025-10");
  });
});

describe("Salin untuk WhatsApp", () => {
  test("urut order, kelompok, alat, kosong, dan ibadah", () => {
    expect(toWhatsAppText(detailToWhatsApp(DETAIL))).toBe(
      [
        "*Pelayan Ibadah Minggu I*",
        "Minggu, 4 Oktober 2026 · 07:30–10:00",
        "Majelis Jemaat",
        "Ibadah: Ibadah Minggu I 07:30",
        "",
        "1. Liturgis: Andreas Sitanggang",
        "2. Singer: Paduan Suara Efrata",
        "3. Pemusik: Bethari Ayu Kusuma (Keyboard)",
        "4. Multimedia: Kevin Nainggolan",
        "5. Pemusik: (belum diisi)",
      ].join("\n"),
    );
  });

  test("tanpa ibadah tidak ada baris Ibadah", () => {
    expect(
      toWhatsAppText({ ...detailToWhatsApp(DETAIL), ibadah: [] }).split(
        "\n",
      )[3],
    ).toBe("");
  });
});

describe("peta galat server", () => {
  const LABELS = [
    "Andreas Sitanggang",
    "Band Pemuda",
    "Christian Wijaya (Gitar)",
    "",
  ];

  test("issues per slot ke field baris; rolePelayanId ke Tugas", () => {
    expect(
      toFormErrors(
        {
          message: "x",
          issues: [
            {
              path: "detail.2.musikSkillId",
              message: "Christian Wijaya Tidak Memiliki Skill Musik Bass",
            },
            {
              path: "detail.0.rolePelayanId",
              message: "Role Pelayan 9 Tidak Ditemukan",
            },
            {
              path: "date",
              message:
                "Jadwal Pelayan Tidak Lagi Sesuai Dengan Ibadah yang Ditautkan (4 Oktober 2026, IBD_0001)",
            },
          ],
        },
        LABELS,
      ),
    ).toEqual([
      {
        field: "slots.2.pelayan",
        message: "Christian Wijaya Tidak Memiliki Skill Musik Bass",
      },
      {
        field: "slots.0.roleId",
        message:
          "Tugas ini sudah dihapus. Muat ulang halaman lalu pilih tugas lain.",
      },
      {
        field: "date",
        message:
          "Jadwal Pelayan Tidak Lagi Sesuai Dengan Ibadah yang Ditautkan (4 Oktober 2026, IBD_0001)",
      },
    ]);
  });

  test("409 bentrok tanpa field dipetakan ke baris lewat nama (orang, alat, anggota kelompok)", () => {
    const clash = (message: string) =>
      toFormErrors({ message, issues: [] }, LABELS)[0];

    expect(
      clash(
        "Christian Wijaya sudah terjadwal di Komisi Pemuda pada 4 Oktober 2026 pukul 09:00 - 11:00. Silakan pilih tanggal atau jam lain",
      ),
    ).toMatchObject({ field: "slots.2.pelayan" });
    expect(
      clash(
        "Eleazar Panggabean (Anggota Band Pemuda) sudah terjadwal di Komisi Pemuda pada 4 Oktober 2026 pukul 17:00 - 19:00. Silakan pilih tanggal atau jam lain",
      ),
    ).toMatchObject({ field: "slots.1.pelayan" });
    expect(
      clash("Andreas Sitanggang Sedang Nonaktif Sebagai Pelayan"),
    ).toMatchObject({ field: "slots.0.pelayan" });
    expect(
      clash(
        "Pelayan sudah terjadwal pada tanggal atau jam yang dipilih. Silakan pilih tanggal atau jam lain",
      ),
    ).toMatchObject({ field: "root" });
    expect(slotIndexOf("Siapa pun sudah terjadwal", LABELS)).toBeNull();
  });

  test("template kembar ke Nama dengan saran; bapel terhapus ke Badan pelayanan", () => {
    expect(
      toFormErrors(
        {
          message: "Nama Template Sudah Tersedia",
          issues: [{ path: "name", message: "Nama Template Sudah Tersedia" }],
        },
        [],
      ),
    ).toEqual([
      {
        field: "name",
        message:
          "Sudah ada template bernama ini. Ganti nama jadwal atau pilih Tidak pada Simpan juga sebagai template.",
      },
    ]);
    expect(
      toFormErrors({ message: "Bapel Tidak Ditemukan", issues: [] }, []),
    ).toEqual([
      {
        field: "bapelId",
        message: "Badan pelayanan ini sudah dihapus. Pilih yang lain.",
      },
    ]);
  });
});
