import { describe, expect, test } from "bun:test";

import {
  EMPTY_IBADAH_FORM,
  attendanceLabel,
  attendanceOf,
  coversService,
  formatServiceDate,
  formatServiceTime,
  hostHint,
  ibadahFormSchema,
  mergeHostOptions,
  toHostOptions,
  monthOptions,
  monthRange,
  salinHref,
  serverFieldError,
  toIbadahApiFilters,
  toIbadahCopy,
  toIbadahForm,
  toIbadahPayload,
  toJadwalOptions,
  withSavedOption,
  type IbadahFormValues,
} from "./model";
import type { IbadahDetail } from "./types";

const DETAIL: IbadahDetail = {
  code: "IBD_0001-2026-0010",
  date: "2026-09-20T00:00:00.000Z",
  startTime: "08:00",
  endTime: "09:30",
  theme: "Hidup dalam kasih karunia",
  bibleVerse: "Efesus 2:8–10",
  preacher: "Pdt. Yohanes Simatupang",
  maleCount: 132,
  femaleCount: 0,
  childCount: 49,
  note: null,
  typeIbadah: { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I" },
  room: { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  bapel: null,
  jadwalPelayan: { id: 7, code: "JDP-0007", name: "Pelayan Minggu I" },
  placeType: "GEREJA",
  placeName: null,
  address: null,
  hostKeluarga: null,
  zoneChurch: null,
};

const HOME: IbadahDetail = {
  ...DETAIL,
  typeIbadah: { id: 6, code: "TYP_IBD-0006", name: "Ibadah Wilayah" },
  room: null,
  placeType: "RUMAH_JEMAAT",
  address: "Jl. Cijerah No. 1",
  hostKeluarga: { id: 1, code: "KK-0001", name: "Keluarga Sitanggang" },
  zoneChurch: { id: 1, code: "ZC-0001", name: "Wilayah I" },
};

const OTHER: IbadahDetail = {
  ...DETAIL,
  room: null,
  placeType: "LAINNYA",
  placeName: "Villa Ciater",
  address: "Jl. Raya Ciater KM 12",
  zoneChurch: { id: 5, code: "ZC-0005", name: "Wilayah V" },
};

const VALID: IbadahFormValues = {
  ...EMPTY_IBADAH_FORM,
  typeIbadahId: "1",
  date: "2026-09-27",
  startTime: "08:00",
};

const errorsOf = (values: IbadahFormValues) => {
  const result = ibadahFormSchema.safeParse(values);

  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

describe("label dan format", () => {
  test("jam dengan dan tanpa selesai", () => {
    expect(formatServiceTime("08:00", "09:30")).toBe("08.00–09.30");
    expect(formatServiceTime("18:00", null)).toBe("18.00");
  });

  test("tanggal ibadah tidak dilokalkan", () => {
    expect(formatServiceDate("2026-09-27T00:00:00.000Z")).toBe(
      "Minggu, 27 Sep 2026",
    );
  });

  test("hadir = jumlah tiga kelompok, dari angka maupun isian form", () => {
    expect(attendanceOf(DETAIL)).toBe(181);
    expect(
      attendanceOf({ maleCount: "1200", femaleCount: "", childCount: "3" }),
    ).toBe(1203);
  });

  test("label hadir: > 0, 0 lampau, 0 hari ini atau nanti", () => {
    const zero = { maleCount: 0, femaleCount: 0, childCount: 0 };

    expect(
      attendanceLabel(
        { ...zero, maleCount: 1200, date: "2026-09-20T00:00:00.000Z" },
        "2026-09-27",
      ),
    ).toBe("1.200 hadir");
    expect(
      attendanceLabel(
        { ...zero, date: "2026-09-26T00:00:00.000Z" },
        "2026-09-27",
      ),
    ).toBe("Belum dicatat");
    expect(
      attendanceLabel(
        { ...zero, date: "2026-09-27T00:00:00.000Z" },
        "2026-09-27",
      ),
    ).toBeNull();
    expect(
      attendanceLabel(
        { ...zero, date: "2026-10-04T00:00:00.000Z" },
        "2026-09-27",
      ),
    ).toBeNull();
  });

  test("salin menuju form tambah dengan kode sumber", () => {
    expect(salinHref("IBD_0001-2026-0010")).toBe(
      "/peribadahan/ibadah/baru?salin=IBD_0001-2026-0010",
    );
  });
});

describe("filter bulan", () => {
  test("13 opsi: bulan depan, bulan ini, 11 sebelumnya, terbaru di atas", () => {
    const options = monthOptions("2026-09-27");

    expect(options).toHaveLength(13);
    expect(options[0]).toEqual({ value: "2026-10", label: "Oktober 2026" });
    expect(options[1]).toEqual({ value: "2026-09", label: "September 2026" });
    expect(options[12]).toEqual({ value: "2025-10", label: "Oktober 2025" });
  });

  test("bulan jadi rentang tanggal berpasangan, tanpa `bulan`", () => {
    expect(monthRange("2026-02")).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
    });
    expect(monthRange("2028-02").end).toBe("2028-02-29");
    expect(monthRange("abc")).toEqual({ start: "", end: "" });
    expect(
      toIbadahApiFilters({ tipe: "3", wilayah: "2", bulan: "2026-02" }),
    ).toEqual({
      typeIbadahId: "3",
      zoneChurchId: "2",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    expect(toIbadahApiFilters({})).toEqual({
      typeIbadahId: "",
      zoneChurchId: "",
      startDate: "",
      endDate: "",
    });
  });
});

describe("skema", () => {
  test("wajib: tipe, tanggal, jam mulai", () => {
    expect(errorsOf(EMPTY_IBADAH_FORM)).toMatchObject({
      typeIbadahId: "Pilih tipe ibadah.",
      date: "Tanggal wajib diisi",
      startTime: "Isi jam mulai.",
    });
    expect(errorsOf(VALID)).toEqual({});
  });

  test("jam selesai kosong lolos; sama atau sebelum jam mulai ditolak", () => {
    expect(errorsOf({ ...VALID, endTime: "09:30" })).toEqual({});
    expect(errorsOf({ ...VALID, endTime: "08:00" })).toEqual({
      endTime: "Jam selesai harus sesudah jam mulai.",
    });
    expect(errorsOf({ ...VALID, endTime: "07:00" })).toEqual({
      endTime: "Jam selesai harus sesudah jam mulai.",
    });
  });

  test("jam selesai tetap diperiksa walau field lain salah", () => {
    expect(
      errorsOf({ ...VALID, typeIbadahId: "", endTime: "07:00" }),
    ).toMatchObject({ endTime: "Jam selesai harus sesudah jam mulai." });
  });

  test("batas panjang", () => {
    expect(
      errorsOf({
        ...VALID,
        theme: "a".repeat(151),
        bibleVerse: "a".repeat(101),
        preacher: "a".repeat(151),
        note: "a".repeat(251),
      }),
    ).toEqual({
      theme: "Tema maksimal 150 karakter.",
      bibleVerse: "Ayat maksimal 100 karakter.",
      preacher: "Nama pengkhotbah maksimal 150 karakter.",
      note: "Catatan maksimal 250 karakter.",
    });
    expect(errorsOf({ ...VALID, theme: "a".repeat(150) })).toEqual({});
  });

  test("rumah jemaat: tuan rumah dan alamat wajib", () => {
    const home = { ...VALID, placeType: "RUMAH_JEMAAT" as const };

    expect(errorsOf({ ...home, address: "  " })).toEqual({
      hostKeluargaId: "Pilih keluarga tuan rumah.",
      address: "Isi alamat tempat ibadah.",
    });
    expect(
      errorsOf({ ...home, hostKeluargaId: "1", address: "Jl. A" }),
    ).toEqual({});
    expect(
      errorsOf({ ...home, hostKeluargaId: "1", address: "a".repeat(251) }),
    ).toEqual({ address: "Alamat maksimal 250 karakter." });
  });

  test("lainnya: nama tempat wajib, alamat opsional", () => {
    const other = { ...VALID, placeType: "LAINNYA" as const };

    expect(errorsOf(other)).toEqual({ placeName: "Isi nama tempat." });
    expect(errorsOf({ ...other, placeName: "a".repeat(151) })).toEqual({
      placeName: "Nama tempat maksimal 150 karakter.",
    });
    expect(errorsOf({ ...other, placeName: "Villa Ciater" })).toEqual({});
  });

  test("field tempat yang tersembunyi tidak divalidasi", () => {
    expect(
      errorsOf({
        ...VALID,
        placeName: "a".repeat(151),
        address: "a".repeat(251),
      }),
    ).toEqual({});
    expect(
      errorsOf({
        ...VALID,
        placeType: "LAINNYA",
        placeName: "Aula",
        hostKeluargaId: "",
      }),
    ).toEqual({});
  });

  test("hitungan hanya digit", () => {
    expect(errorsOf({ ...VALID, maleCount: "1.200" })).toEqual({
      maleCount: "Isi angka tanpa titik atau koma.",
    });
    expect(errorsOf({ ...VALID, childCount: "-1" })).toEqual({
      childCount: "Isi angka tanpa titik atau koma.",
    });
    expect(errorsOf({ ...VALID, femaleCount: "1200" })).toEqual({});
  });
});

describe("form ↔ payload", () => {
  test("detail → form: tanggal YYYY-MM-DD, 0 jadi kosong, relasi jadi id", () => {
    expect(toIbadahForm(DETAIL)).toEqual({
      typeIbadahId: "1",
      date: "2026-09-20",
      startTime: "08:00",
      endTime: "09:30",
      theme: "Hidup dalam kasih karunia",
      bibleVerse: "Efesus 2:8–10",
      preacher: "Pdt. Yohanes Simatupang",
      placeType: "GEREJA",
      zoneChurchId: "",
      roomId: "1",
      hostKeluargaId: "",
      placeName: "",
      address: "",
      bapelId: "",
      jadwalPelayanId: "7",
      maleCount: "132",
      femaleCount: "",
      childCount: "49",
      note: "",
    });
  });

  test("bolak-balik: semua kunci body ada, jadwal pelayan tersimpan ikut", () => {
    expect(toIbadahPayload(toIbadahForm(DETAIL))).toEqual({
      typeIbadahId: 1,
      date: "2026-09-20",
      startTime: "08:00",
      endTime: "09:30",
      theme: "Hidup dalam kasih karunia",
      bibleVerse: "Efesus 2:8–10",
      preacher: "Pdt. Yohanes Simatupang",
      placeType: "GEREJA",
      hostKeluargaId: null,
      placeName: null,
      address: null,
      zoneChurchId: null,
      roomId: 1,
      bapelId: null,
      jadwalPelayanId: 7,
      maleCount: 132,
      femaleCount: 0,
      childCount: 49,
      note: null,
    });
  });

  test("isian kosong: jam selesai null, teks di-trim lalu null, hitungan 0", () => {
    expect(
      toIbadahPayload({ ...VALID, theme: "  ", preacher: " Pdt. A " }),
    ).toEqual({
      typeIbadahId: 1,
      date: "2026-09-27",
      startTime: "08:00",
      endTime: null,
      theme: null,
      bibleVerse: null,
      preacher: "Pdt. A",
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
    });
  });
});

describe("tempat di payload", () => {
  const PLACE = {
    roomId: "1",
    hostKeluargaId: "4",
    placeName: "Villa",
    address: " Jl. A ",
    zoneChurchId: "2",
  };
  const placeOf = (placeType: IbadahFormValues["placeType"]) => {
    const payload = toIbadahPayload({ ...VALID, ...PLACE, placeType });

    return {
      placeType: payload.placeType,
      roomId: payload.roomId,
      hostKeluargaId: payload.hostKeluargaId,
      placeName: payload.placeName,
      address: payload.address,
      zoneChurchId: payload.zoneChurchId,
    };
  };

  test("field yang bukan milik tipe tempat dikirim null; wilayah untuk semua", () => {
    expect(placeOf("GEREJA")).toEqual({
      placeType: "GEREJA",
      roomId: 1,
      hostKeluargaId: null,
      placeName: null,
      address: null,
      zoneChurchId: 2,
    });
    expect(placeOf("RUMAH_JEMAAT")).toEqual({
      placeType: "RUMAH_JEMAAT",
      roomId: null,
      hostKeluargaId: 4,
      placeName: null,
      address: "Jl. A",
      zoneChurchId: 2,
    });
    expect(placeOf("LAINNYA")).toEqual({
      placeType: "LAINNYA",
      roomId: null,
      hostKeluargaId: null,
      placeName: "Villa",
      address: "Jl. A",
      zoneChurchId: 2,
    });
  });

  test("bolak-balik rumah jemaat dan lainnya", () => {
    expect(toIbadahForm(HOME)).toMatchObject({
      placeType: "RUMAH_JEMAAT",
      hostKeluargaId: "1",
      address: "Jl. Cijerah No. 1",
      zoneChurchId: "1",
      roomId: "",
    });
    expect(toIbadahPayload(toIbadahForm(HOME))).toMatchObject({
      placeType: "RUMAH_JEMAAT",
      hostKeluargaId: 1,
      address: "Jl. Cijerah No. 1",
      zoneChurchId: 1,
      roomId: null,
      placeName: null,
    });
    expect(toIbadahPayload(toIbadahForm(OTHER))).toMatchObject({
      placeName: "Villa Ciater",
      address: "Jl. Raya Ciater KM 12",
      zoneChurchId: 5,
    });
  });
});

describe("salin", () => {
  test("tipe aktif, jam, ruang, badan pelayanan ikut; sisanya kosong", () => {
    expect(
      toIbadahCopy(
        { ...DETAIL, bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" } },
        ["1", "2"],
        ["1"],
      ),
    ).toEqual({
      ...EMPTY_IBADAH_FORM,
      typeIbadahId: "1",
      startTime: "08:00",
      endTime: "09:30",
      roomId: "1",
      bapelId: "2",
    });
  });

  test("tipe nonaktif tidak ikut; ruang dan jam selesai kosong tetap kosong", () => {
    expect(
      toIbadahCopy({ ...DETAIL, room: null, endTime: null }, ["2", "3"], []),
    ).toEqual({ ...EMPTY_IBADAH_FORM, startTime: "08:00" });
  });

  test("rumah jemaat: tipe tempat dan wilayah ikut, tuan rumah dan alamat tidak", () => {
    expect(toIbadahCopy(HOME, ["6"], ["1", "2"])).toEqual({
      ...EMPTY_IBADAH_FORM,
      typeIbadahId: "6",
      startTime: "08:00",
      endTime: "09:30",
      placeType: "RUMAH_JEMAAT",
      zoneChurchId: "1",
    });
  });

  test("lainnya: nama dan alamat ikut; wilayah nonaktif tidak", () => {
    expect(toIbadahCopy(OTHER, ["1"], ["1", "2"])).toMatchObject({
      placeType: "LAINNYA",
      placeName: "Villa Ciater",
      address: "Jl. Raya Ciater KM 12",
      zoneChurchId: "",
      roomId: "",
    });
  });
});

describe("saran tuan rumah", () => {
  test("hint: belum pernah, terakhir, dijadwalkan", () => {
    expect(hostHint(null, "2026-09-27")).toBe("Belum pernah");
    expect(hostHint("2026-09-10T00:00:00.000Z", "2026-09-27")).toBe(
      "Terakhir 10 Sep 2026",
    );
    expect(hostHint("2026-09-27T00:00:00.000Z", "2026-09-27")).toBe(
      "Dijadwalkan 27 Sep 2026",
    );
  });

  test("saran dulu dengan hint dan disaring kata cari (pilihan aktif tetap ada); ddl tanpa duplikat, tanpa hint", () => {
    const suggestions = [
      {
        id: 23,
        code: "KK-0023",
        name: "Keluarga Sembiring",
        lastHostedDate: null,
      },
      {
        id: 1,
        code: "KK-0001",
        name: "Keluarga Sitanggang",
        lastHostedDate: "2026-09-10T00:00:00.000Z",
      },
    ];
    const found = [
      { value: "1", label: "Keluarga Sitanggang" },
      { value: "3", label: "Keluarga Wijaya" },
    ];

    const suggested = toHostOptions(suggestions, "2026-09-27");

    expect(mergeHostOptions(suggested, found, "", "")).toEqual([
      { value: "23", label: "Keluarga Sembiring", hint: "Belum pernah" },
      {
        value: "1",
        label: "Keluarga Sitanggang",
        hint: "Terakhir 10 Sep 2026",
      },
      { value: "3", label: "Keluarga Wijaya" },
    ]);
    expect(
      mergeHostOptions(suggested, found, " SITA", "").map(
        (option) => option.value,
      ),
    ).toEqual(["1", "3"]);
    expect(
      mergeHostOptions(suggested, found, "wija", "23").map(
        (option) => option.value,
      ),
    ).toEqual(["23", "3"]);
    expect(mergeHostOptions(suggested, found, "wija", "23")[0]).toBe(
      suggested[0],
    );
    expect(mergeHostOptions([], found, "", "")).toEqual(found);
  });
});

describe("pilihan tersimpan", () => {
  const options = [{ value: "1", label: "Gedung Gereja" }];

  test("relasi terhapus ditambahkan sekali; yang ada tidak digandakan", () => {
    const saved = { id: 9, code: "RM-0009", name: "Aula Lama" };

    expect(withSavedOption(options, saved)).toEqual([
      ...options,
      { value: "9", label: "Aula Lama" },
    ]);
    expect(withSavedOption(options, DETAIL.room)).toBe(options);
    expect(withSavedOption(options, null)).toBe(options);
  });
});

describe("pesan server → field", () => {
  test("409 ke jam mulai dengan nama tipe", () => {
    expect(
      serverFieldError(
        "Ibadah dengan tipe, tanggal, jam mulai dan wilayah yang sama sudah tercatat. Isi Wilayah jika ibadah ini untuk wilayah yang berbeda",
        "Ibadah Minggu I",
      ),
    ).toEqual({
      field: "startTime",
      message:
        "Ibadah Minggu I pada tanggal, jam, dan wilayah ini sudah tercatat. Ubah jam mulai atau wilayah, atau buka data yang sudah ada dari daftar.",
    });
  });

  test("tipe, ruang, bapel, jadwal pelayan ke field; 404 ibadah ke root", () => {
    const fieldOf = (message: string) =>
      serverFieldError(message, "Tipe")?.field ?? "root";

    expect(
      fieldOf("Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain"),
    ).toBe("typeIbadahId");
    expect(fieldOf("Tipe Ibadah Tidak Ditemukan")).toBe("typeIbadahId");
    expect(fieldOf("Ruangan Tidak Ditemukan")).toBe("roomId");
    expect(fieldOf("Bapel Tidak Ditemukan")).toBe("bapelId");
    expect(fieldOf("Keluarga Tuan Rumah Tidak Ditemukan")).toBe(
      "hostKeluargaId",
    );
    expect(fieldOf("Wilayah Gereja Tidak Ditemukan")).toBe("zoneChurchId");
    expect(serverFieldError("Wilayah Gereja Tidak Ditemukan", "Tipe")).toEqual({
      field: "zoneChurchId",
      message: "Wilayah ini sudah dihapus. Pilih wilayah lain atau kosongkan.",
    });
    expect(
      serverFieldError(
        "Jadwal Pelayan Tersebut Tidak Sesuai Dengan Tanggal atau Jam Ibadah",
        "Tipe",
      ),
    ).toEqual({
      field: "jadwalPelayanId",
      message:
        "Jadwal pelayan ini tidak sesuai dengan tanggal atau jam ibadah. Pilih jadwal lain.",
    });
    expect(serverFieldError("Jadwal Pelayan Tidak Ditemukan", "Tipe")).toEqual({
      field: "jadwalPelayanId",
      message:
        "Jadwal pelayan ini sudah dihapus. Pilih jadwal lain atau kosongkan.",
    });
    expect(fieldOf("Ibadah Tidak Ditemukan")).toBe("root");
  });
});

describe("jadwal pelayan yang bersinggungan dengan ibadah", () => {
  const DAY = "2026-10-04";
  const ROSTER = {
    date: `${DAY}T00:00:00.000Z`,
    startTime: "07:00",
    endTime: "09:00",
  };

  test.each([
    ["07:30", "08:30", true],
    ["06:00", "07:00", true],
    ["09:00", "10:00", false],
    ["09:30", "", false],
    ["08:00", "", true],
    ["05:00", "06:59", false],
  ])(
    "ibadah %s–%s → %s (sama dengan be-sada)",
    (startTime, endTime, isCovered) => {
      expect(coversService(ROSTER, { date: DAY, startTime, endTime })).toBe(
        isCovered,
      );
    },
  );

  test("tanggal lain tidak pernah bersinggungan", () => {
    expect(
      coversService(ROSTER, {
        date: "2026-10-05",
        startTime: "07:30",
        endTime: "08:00",
      }),
    ).toBe(false);
  });

  test("opsi: hanya yang bersinggungan, hint jam jadwal", () => {
    const rosters = [
      {
        ...ROSTER,
        id: 1,
        code: "JDL_1",
        name: "Minggu Pagi",
        endTime: "10:00",
      },
      {
        ...ROSTER,
        id: 2,
        code: "JDL_2",
        name: "Pemuda",
        startTime: "17:00",
        endTime: "19:00",
      },
    ];

    expect(
      toJadwalOptions(rosters, {
        date: DAY,
        startTime: "07:30",
        endTime: "10:00",
      }),
    ).toEqual([{ value: "1", label: "Minggu Pagi", hint: "07:00–10:00" }]);
  });
});
