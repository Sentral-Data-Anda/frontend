import { describe, expect, test } from "bun:test";

import { addMonths, addDays, startOfMonth, todayJakarta } from "@/lib/date";

import {
  EMPTY_ABSENSI_FORM,
  MONTH_ALL,
  PAYROLL_NOTE,
  absensiFormSchema,
  hoursTextOf,
  monthFilterOptions,
  serverFieldError,
  subtitleOf,
  toAbsensiApiFilters,
  toAbsensiForm,
  toAbsensiPayload,
  type AbsensiFormValues,
} from "./model";
import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_STATUS_VARIANT,
  ATTENDANCE_STATUSES,
  type AbsensiKaryawan,
  type AttendanceStatus,
} from "./types";

const TODAY = todayJakarta();

const form = (
  overrides: Partial<AbsensiFormValues> = {},
): AbsensiFormValues => ({
  ...EMPTY_ABSENSI_FORM,
  karyawanId: "3",
  date: TODAY,
  status: "HADIR",
  checkIn: "08:00",
  checkOut: "17:00",
  ...overrides,
});

const issuesOf = (values: AbsensiFormValues) => {
  const parsed = absensiFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
};

const pathsOf = (values: AbsensiFormValues) =>
  issuesOf(values).map((issue) => issue.path);

describe("skema jam dinding", () => {
  test("menerima batas 00:00 dan 23:59", () => {
    expect(pathsOf(form({ checkIn: "00:00", checkOut: "23:59" }))).toEqual([]);
  });

  test("menolak 24:00 dan jam tanpa nol di depan", () => {
    expect(pathsOf(form({ checkIn: "24:00", checkOut: "" }))).toEqual([
      "checkIn",
    ]);
    expect(pathsOf(form({ checkIn: "8:00", checkOut: "" }))).toEqual([
      "checkIn",
    ]);
    expect(pathsOf(form({ checkIn: "", checkOut: "23:60" }))).toEqual([
      "checkOut",
    ]);
  });

  test("kosong diterima di kedua sisi", () => {
    expect(pathsOf(form({ checkIn: "", checkOut: "" }))).toEqual([]);
    expect(pathsOf(form({ checkIn: "08:00", checkOut: "" }))).toEqual([]);
  });

  test("jam pulang sama dengan jam masuk diterima, lebih awal ditolak", () => {
    expect(pathsOf(form({ checkIn: "08:00", checkOut: "08:00" }))).toEqual([]);
    expect(pathsOf(form({ checkIn: "09:00", checkOut: "08:59" }))).toEqual([
      "checkOut",
    ]);
  });

  test("urutan jam tidak diperiksa untuk status yang jamnya dibuang", () => {
    expect(
      pathsOf(form({ status: "LIBUR", checkIn: "09:00", checkOut: "08:00" })),
    ).toEqual([]);
  });
});

describe("skema tanggal dan wajib", () => {
  test("hari ini diterima, besok ditolak", () => {
    expect(pathsOf(form({ date: TODAY }))).toEqual([]);
    expect(pathsOf(form({ date: addDays(TODAY, 1) }))).toEqual(["date"]);
  });

  test("kemarin diterima", () => {
    expect(pathsOf(form({ date: addDays(TODAY, -1) }))).toEqual([]);
  });

  test("tanggal dan karyawan kosong masing-masing bergalat", () => {
    expect(pathsOf(form({ date: "", karyawanId: "" })).sort()).toEqual([
      "date",
      "karyawanId",
    ]);
  });

  test("catatan 250 karakter diterima, 251 ditolak", () => {
    expect(pathsOf(form({ note: "a".repeat(250) }))).toEqual([]);
    expect(pathsOf(form({ note: "a".repeat(251) }))).toEqual(["note"]);
  });
});

describe("skema status", () => {
  test("keenam nilai diterima", () => {
    for (const status of ATTENDANCE_STATUSES) {
      expect(pathsOf(form({ status, checkIn: "", checkOut: "" }))).toEqual([]);
    }
  });

  test("nilai di luar enum ditolak", () => {
    expect(
      pathsOf(form({ status: "MANGKIR" as AbsensiFormValues["status"] })),
    ).toEqual(["status"]);
  });
});

describe("payload", () => {
  test("Hadir mengirim kedua jam dan tanggal YYYY-MM-DD", () => {
    expect(toAbsensiPayload(form({ date: "2026-05-12" }))).toEqual({
      karyawanId: 3,
      date: "2026-05-12",
      checkIn: "08:00",
      checkOut: "17:00",
      status: "HADIR",
      note: null,
    });
  });

  test("status di luar Hadir mengirim kedua jam null, walau nilainya tertinggal", () => {
    for (const status of ATTENDANCE_STATUSES.filter((it) => it !== "HADIR")) {
      const payload = toAbsensiPayload(
        form({ status, checkIn: "08:00", checkOut: "17:00" }),
      );

      expect([payload.status, payload.checkIn, payload.checkOut]).toEqual([
        status,
        null,
        null,
      ]);
    }
  });

  test("jam kosong jadi null, catatan dirapikan lalu null bila kosong", () => {
    expect(
      toAbsensiPayload(form({ checkIn: "", checkOut: "", note: "   " })),
    ).toMatchObject({ checkIn: null, checkOut: null, note: null });
    expect(toAbsensiPayload(form({ note: "  izin   keluarga " })).note).toBe(
      "izin keluarga",
    );
  });

  test("baris server kembali jadi isian form", () => {
    const row: AbsensiKaryawan = {
      id: 9,
      publicId: "abs-0009",
      karyawanId: 2,
      karyawan: { publicId: "kry-2", code: "KRY-0002", name: "Budi Santoso" },
      date: "2026-05-12T00:00:00.000Z",
      checkIn: null,
      checkOut: null,
      status: "IZIN",
      note: null,
    };

    expect(toAbsensiForm(row)).toEqual({
      karyawanId: "2",
      date: "2026-05-12",
      status: "IZIN",
      checkIn: "",
      checkOut: "",
      note: "",
    });
  });
});

describe("teks jam daftar", () => {
  test("null di kedua sisi berarti tidak ada jamnya", () => {
    expect(hoursTextOf({ checkIn: null, checkOut: null })).toBe("Tanpa jam");
  });

  test("satu sisi null disebut sisinya, bukan dua tanda baca bertumpuk", () => {
    expect(hoursTextOf({ checkIn: "08:00", checkOut: null })).toBe(
      "Masuk 08:00",
    );
    expect(hoursTextOf({ checkIn: null, checkOut: "17:00" })).toBe(
      "Pulang 17:00",
    );
  });

  test("kedua sisi terisi dirender sebagai rentang", () => {
    expect(hoursTextOf({ checkIn: "08:00", checkOut: "17:00" })).toBe(
      "08:00–17:00",
    );
  });
});

describe("filter rentang tanggal", () => {
  test("bawaannya bulan ini", () => {
    const current = startOfMonth(TODAY).slice(0, 7);

    expect(toAbsensiApiFilters({})).toMatchObject({
      startDate: `${current}-01`,
    });
    expect(toAbsensiApiFilters({}).endDate.slice(0, 7)).toBe(current);
  });

  test("Semua bulan mencabut kedua batas", () => {
    expect(toAbsensiApiFilters({ bulan: MONTH_ALL })).toEqual({
      karyawanId: "",
      startDate: "",
      endDate: "",
    });
  });

  test("bulan yang dipilih dan karyawan diteruskan", () => {
    expect(toAbsensiApiFilters({ bulan: "2026-03", karyawan: "4" })).toEqual({
      karyawanId: "4",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
  });

  test("pilihan pertama Bulan ini, dan bulan berjalan tidak muncul dua kali", () => {
    const options = monthFilterOptions("2026-05-12");

    expect(options[0]).toEqual({ value: "", label: "Bulan ini" });
    expect(options.filter((it) => it.value === "2026-05")).toEqual([]);
    expect(options.filter((it) => it.value === MONTH_ALL)).toHaveLength(1);
  });

  // Server menolak tanggal yang belum terjadi, jadi bulan depan adalah pilihan
  // yang tidak akan pernah memuat satu baris pun.
  test("nol bulan di masa depan, dan posisi ketiga adalah bulan lalu", () => {
    const options = monthFilterOptions("2026-05-12");
    const months = options
      .map((it) => it.value)
      .filter((it) => /^\d{4}-\d{2}$/.test(it));

    expect(months.filter((it) => it >= "2026-05")).toEqual([]);
    expect(options[2]).toMatchObject({ value: "2026-04" });
  });

  test("nol bulan di masa depan juga di batas tahun", () => {
    const next = addMonths(startOfMonth(TODAY), 1).slice(0, 7);
    const months = monthFilterOptions()
      .map((it) => it.value)
      .filter((it) => /^\d{4}-\d{2}$/.test(it));

    expect(months.includes(next)).toBe(false);
    expect(months.includes(startOfMonth(TODAY).slice(0, 7))).toBe(false);
  });
});

// Filter bulan bawaan menyaring, tapi `useListParams` membaca nilai kosong
// sebagai "tanpa filter" — jadi angkanya harus menyebut periodenya sendiri.
describe("subjudul menyebut periodenya", () => {
  test("bawaan menyebut bulan berjalan, bukan angka telanjang", () => {
    expect(subtitleOf(12, {}, "2026-05-12")).toBe(
      "12 catatan absensi · Mei 2026",
    );
  });

  test("Semua bulan dikatakan apa adanya", () => {
    expect(subtitleOf(14, { bulan: MONTH_ALL }, "2026-05-12")).toBe(
      "14 catatan absensi · semua bulan",
    );
  });

  test("bulan yang dipilih dinamai", () => {
    expect(subtitleOf(3, { bulan: "2026-03" }, "2026-05-12")).toBe(
      "3 catatan absensi · Maret 2026",
    );
  });

  test("tanpa data belum ada subjudul", () => {
    expect(subtitleOf(undefined, {})).toBeUndefined();
  });
});

describe("pesan server ke field", () => {
  test("409 tanggal ganda jatuh ke field tanggal", () => {
    expect(
      serverFieldError(
        "Karyawan Ini Sudah Memiliki Absensi Pada Tanggal Tersebut. Ubah Data Yang Ada",
      ),
    ).toMatchObject({ field: "date" });
  });

  test("ejaan huruf kecil constraint DB jatuh ke field yang sama", () => {
    expect(
      serverFieldError(
        "Karyawan ini sudah memiliki absensi pada tanggal tersebut",
      ),
    ).toMatchObject({ field: "date" });
  });

  test("tanggal masa depan jatuh ke field tanggal", () => {
    expect(
      serverFieldError("Tanggal Absensi Tidak Boleh Melewati Hari Ini"),
    ).toMatchObject({ field: "date" });
  });

  test("karyawan tidak ditemukan jatuh ke field karyawan", () => {
    expect(serverFieldError("Karyawan Tidak Ditemukan")).toMatchObject({
      field: "karyawanId",
    });
  });

  test("pesan yang menyebut kedua jam jatuh ke jam pulang, bukan jam masuk", () => {
    expect(
      serverFieldError("Jam Pulang tidak boleh sebelum Jam Masuk"),
    ).toMatchObject({ field: "checkOut" });
  });

  test("format jam masuk jatuh ke jam masuk", () => {
    expect(
      serverFieldError("Format Jam Masuk harus HH:mm (contoh: 08:00)"),
    ).toMatchObject({ field: "checkIn" });
  });

  test("pesan yang tidak dikenal tetap galat tingkat form", () => {
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});

// U-F: absensi dibaca nol konsumen. Kalimat ini yang menghalangi layar
// menjanjikan potongan yang tidak pernah terjadi.
describe("absensi tidak memengaruhi gaji, dan itu tertulis", () => {
  test("catatan menyebut Penggajian tidak membaca absensi", () => {
    expect(PAYROLL_NOTE).toMatch(/Penggajian tidak membaca absensi/);
    expect(PAYROLL_NOTE).toMatch(/tidak mengurangi gaji/);
  });
});

/**
 * Tabel warnanya sebelumnya bisa diacak seluruhnya tanpa satu test merah.
 * Ini menyatakan apa yang dirender, bukan hanya memetakannya.
 */
describe("chip status", () => {
  // Dilebarkan dengan sengaja: `as const satisfies` mempersempit tipenya
  // sampai `"due"` jadi galat kompilasi — bagus, tapi assertion yang tidak
  // bisa dikompilasi bukan assertion, dan tipenya bisa dilebarkan lagi.
  const VARIANT: Record<AttendanceStatus, string> = ATTENDANCE_STATUS_VARIANT;

  test("Hadir satu-satunya yang positif", () => {
    expect(VARIANT.HADIR).toBe("success");
    expect(
      ATTENDANCE_STATUSES.filter((status) => VARIANT[status] === "success"),
    ).toEqual(["HADIR"]);
  });

  test("Libur satu-satunya yang netral", () => {
    expect(
      ATTENDANCE_STATUSES.filter((status) => VARIANT[status] === "neutral"),
    ).toEqual(["LIBUR"]);
  });

  test("tiga absen beralasan berbagi satu varian", () => {
    expect(
      ATTENDANCE_STATUSES.filter((status) => VARIANT[status] === "wait"),
    ).toEqual(["IZIN", "SAKIT", "CUTI"]);
  });

  // `due` memerahkan teksnya, dan di seluruh aplikasi ia berarti ditolak,
  // gagal, atau jatuh tempo. Absensi nol pengaruh uang (U-F).
  test("nol status memakai kosakata kegagalan uang", () => {
    expect(
      ATTENDANCE_STATUSES.filter((status) => VARIANT[status] === "due"),
    ).toEqual([]);
  });

  test("Alpa menonjol tanpa merah", () => {
    expect(VARIANT.ALPA).toBe("draft");
    expect(
      ATTENDANCE_STATUSES.filter((status) => VARIANT[status] === "draft"),
    ).toEqual(["ALPA"]);
  });

  test("keenam status punya label Indonesia, bukan nama enum", () => {
    for (const status of ATTENDANCE_STATUSES) {
      expect(ATTENDANCE_STATUS_LABEL[status]).not.toBe(status);
      expect(ATTENDANCE_STATUS_LABEL[status].length).toBeGreaterThan(0);
    }
  });
});
