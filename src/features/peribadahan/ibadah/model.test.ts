import { describe, expect, test } from "bun:test";

import {
  EMPTY_IBADAH_FORM,
  attendanceLabel,
  attendanceOf,
  formatServiceDate,
  formatServiceTime,
  ibadahFormSchema,
  monthOptions,
  monthRange,
  salinHref,
  serverFieldError,
  toIbadahApiFilters,
  toIbadahCopy,
  toIbadahForm,
  toIbadahPayload,
  withSavedOption,
  type IbadahFormValues,
} from "./model";
import type { Ibadah } from "./types";

const DETAIL: Ibadah = {
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
    expect(toIbadahApiFilters({ tipe: "3", bulan: "2026-02" })).toEqual({
      typeIbadahId: "3",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    expect(toIbadahApiFilters({})).toEqual({
      typeIbadahId: "",
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
      roomId: "1",
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

describe("salin", () => {
  test("tipe aktif, jam, ruang, badan pelayanan ikut; sisanya kosong", () => {
    expect(
      toIbadahCopy(
        { ...DETAIL, bapel: { id: 2, code: "BPL-2", name: "Komisi Pemuda" } },
        ["1", "2"],
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
      toIbadahCopy({ ...DETAIL, room: null, endTime: null }, ["2", "3"]),
    ).toEqual({ ...EMPTY_IBADAH_FORM, startTime: "08:00" });
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
        "Ibadah dengan tipe, tanggal dan jam mulai yang sama sudah tercatat",
        "Ibadah Minggu I",
      ),
    ).toEqual({
      field: "startTime",
      message:
        "Ibadah Minggu I pada tanggal dan jam ini sudah tercatat. Ubah jam mulai, atau buka data yang sudah ada dari daftar.",
    });
  });

  test("tipe, ruang, bapel ke field; jadwal pelayan dan 404 ibadah ke root", () => {
    const fieldOf = (message: string) =>
      serverFieldError(message, "Tipe")?.field ?? "root";

    expect(
      fieldOf("Tipe Ibadah Tersebut Sudah Tidak Aktif. Pilih Tipe Ibadah Lain"),
    ).toBe("typeIbadahId");
    expect(fieldOf("Tipe Ibadah Tidak Ditemukan")).toBe("typeIbadahId");
    expect(fieldOf("Ruangan Tidak Ditemukan")).toBe("roomId");
    expect(fieldOf("Bapel Tidak Ditemukan")).toBe("bapelId");
    expect(
      fieldOf(
        "Jadwal Pelayan Tersebut Tidak Sesuai Dengan Tanggal atau Jam Ibadah",
      ),
    ).toBe("root");
    expect(fieldOf("Ibadah Tidak Ditemukan")).toBe("root");
  });
});
