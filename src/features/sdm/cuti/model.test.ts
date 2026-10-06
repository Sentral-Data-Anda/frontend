import { describe, expect, test } from "bun:test";

import { cutiKeys } from "./api";
import {
  calendarDaysOf,
  chargedYearOf,
  cutiFormSchema,
  isAllHoliday,
  isCancellable,
  isEditable,
  maxWorkingDaysOf,
  quotaSpentTextOf,
  quotaTextOf,
  rangeTextOf,
  rejectedTextOf,
  serverFieldError,
  statusTextOf,
  toCutiForm,
  toCutiPayload,
  type CutiFormValues,
} from "./model";
import { CUTI_STATUS_LABEL, type Cuti, type HolidayDay } from "./types";

const VALID: CutiFormValues = {
  karyawanId: "1",
  leaveTypeId: "2",
  startDate: "2026-05-12",
  endDate: "2026-05-16",
  length: "penuh",
  reason: "Menengok orang tua",
};

const cuti = (patch: Partial<Cuti> = {}): Cuti => ({
  id: 1,
  publicId: "cti-1",
  code: "CTI-0001",
  karyawanId: 1,
  leaveTypeId: 1,
  startDate: "2026-05-12T00:00:00.000Z",
  endDate: "2026-05-16T00:00:00.000Z",
  totalDays: "5",
  reason: "Menengok orang tua",
  status: "PENDING",
  rejectedReason: null,
  approvedAt: null,
  karyawan: {
    publicId: "kry-1",
    code: "KRY-0001",
    name: "Ani Wijaya",
    position: "Sekretaris",
  },
  leaveType: {
    publicId: "tct-1",
    code: "TCT-0001",
    name: "Cuti Tahunan",
    isPaid: true,
    maxDaysPerYear: 12,
  },
  ...patch,
});

const holiday = (date: string, name: string): HolidayDay => ({
  date,
  name,
  type: "NASIONAL",
});

describe("skema form cuti", () => {
  test("menerima isian lengkap", () => {
    expect(cutiFormSchema.safeParse(VALID).success).toBe(true);
  });

  test.each([
    ["karyawanId", "Pilih karyawan yang mengajukan cuti"],
    ["leaveTypeId", "Pilih tipe cuti"],
    ["startDate", "Isi tanggal mulai cuti"],
    ["endDate", "Isi tanggal selesai cuti"],
    ["reason", "Tulis alasan cuti"],
  ])("%s kosong ditolak", (field, message) => {
    const parsed = cutiFormSchema.safeParse({ ...VALID, [field]: "" });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe(message);
  });

  test("tanggal selesai sebelum mulai ditolak di field endDate", () => {
    const parsed = cutiFormSchema.safeParse({
      ...VALID,
      endDate: "2026-05-11",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["endDate"]);
  });

  test("setengah hari pada rentang lebih dari satu hari ditolak", () => {
    const parsed = cutiFormSchema.safeParse({ ...VALID, length: "setengah" });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["length"]);
  });

  test("setengah hari pada rentang satu hari diterima", () => {
    const parsed = cutiFormSchema.safeParse({
      ...VALID,
      endDate: VALID.startDate,
      length: "setengah",
    });

    expect(parsed.success).toBe(true);
  });

  test("alasan 250 karakter lolos, 251 ditolak", () => {
    expect(
      cutiFormSchema.safeParse({ ...VALID, reason: "a".repeat(250) }).success,
    ).toBe(true);
    expect(
      cutiFormSchema.safeParse({ ...VALID, reason: "a".repeat(251) }).success,
    ).toBe(false);
  });
});

describe("payload", () => {
  test("tidak pernah mengirim totalDays: panjangnya dihitung server", () => {
    const payload = toCutiPayload(VALID) as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual([
      "endDate",
      "halfDay",
      "karyawanId",
      "leaveTypeId",
      "reason",
      "startDate",
    ]);
    expect("totalDays" in payload).toBe(false);
  });

  test("id numerik, tanggal YYYY-MM-DD, halfDay boolean", () => {
    const payload = toCutiPayload({
      ...VALID,
      endDate: VALID.startDate,
      length: "setengah",
    });

    expect(payload).toEqual({
      karyawanId: 1,
      leaveTypeId: 2,
      startDate: "2026-05-12",
      endDate: "2026-05-12",
      halfDay: true,
      reason: "Menengok orang tua",
    });
  });

  test("baris setengah hari kembali ke form sebagai setengah", () => {
    expect(
      toCutiForm(
        cuti({
          totalDays: "0.5",
          endDate: "2026-05-12T00:00:00.000Z",
        }),
      ).length,
    ).toBe("setengah");
    expect(toCutiForm(cuti()).length).toBe("penuh");
  });
});

describe("hitungan hari di layar", () => {
  test("rentang inklusif kedua ujungnya", () => {
    expect(calendarDaysOf("2026-05-12", "2026-05-16")).toBe(5);
    expect(calendarDaysOf("2026-05-12", "2026-05-12")).toBe(1);
  });

  test("Februari kabisat dihitung benar", () => {
    expect(calendarDaysOf("2024-02-27", "2024-03-01")).toBe(4);
    expect(calendarDaysOf("2026-02-27", "2026-03-01")).toBe(3);
  });

  test("rentang terbalik nol, bukan negatif", () => {
    expect(calendarDaysOf("2026-05-16", "2026-05-12")).toBe(0);
  });

  test("hari libur di dalam rentang mengurangi batas atas", () => {
    const holidays = [
      holiday("2026-05-14", "Kenaikan Isa Almasih"),
      holiday("2026-05-20", "Di luar rentang"),
    ];

    expect(maxWorkingDaysOf("2026-05-12", "2026-05-16", holidays, false)).toBe(
      4,
    );
  });

  test("setengah hari mengurangi 0,5 dan tidak pernah negatif", () => {
    expect(maxWorkingDaysOf("2026-05-12", "2026-05-12", [], true)).toBe(0.5);
    expect(
      maxWorkingDaysOf(
        "2026-05-12",
        "2026-05-12",
        [holiday("2026-05-12", "Libur")],
        true,
      ),
    ).toBe(0);
  });

  test("rentang yang seluruhnya libur ditolak sebelum kirim", () => {
    expect(
      isAllHoliday("2026-05-12", "2026-05-13", [
        holiday("2026-05-12", "Libur A"),
        holiday("2026-05-13", "Libur B"),
      ]),
    ).toBe(true);
    expect(
      isAllHoliday("2026-05-12", "2026-05-13", [
        holiday("2026-05-12", "Libur A"),
      ]),
    ).toBe(false);
    expect(isAllHoliday("", "", [])).toBe(false);
  });
});

describe("sisa jatah di layar", () => {
  test("sisa yang dikembalikan server dirender apa adanya", () => {
    expect(
      quotaTextOf({
        karyawan: { name: "Ani" },
        leaveType: { name: "Cuti Tahunan" },
        year: 2026,
        maxDaysPerYear: 12,
        taken: "5",
        remaining: "7",
      }),
    ).toBe("7 hari");
  });

  test("sisa 0 dari jatah yang terlampaui tidak pernah terbaca minus", () => {
    const text = quotaTextOf({
      karyawan: { name: "Ani" },
      leaveType: { name: "Cuti Tahunan" },
      year: 2026,
      maxDaysPerYear: 12,
      taken: "14",
      remaining: "0",
    });

    expect(text).toBe("0 hari");
    expect(text).not.toContain("-");
    expect(text).not.toContain("−");
  });

  test("tanpa batas bukan '—'", () => {
    expect(
      quotaTextOf({
        karyawan: { name: "Ani" },
        leaveType: { name: "Cuti Melahirkan" },
        year: 2026,
        maxDaysPerYear: null,
        taken: "66",
        remaining: null,
      }),
    ).toBe("Tanpa batas");
  });

  test("kalimat terpakai menyebut jatahnya, jadi sisa 0 punya penjelasan", () => {
    expect(
      quotaSpentTextOf({
        karyawan: { name: "Ani" },
        leaveType: { name: "Cuti Tahunan" },
        year: 2026,
        maxDaysPerYear: 12,
        taken: "14",
        remaining: "0",
      }),
    ).toBe("Sudah diambil 14 hari dari jatah 12 hari (2026)");
  });

  test("tipe tanpa batas tidak mengarang jatah", () => {
    expect(
      quotaSpentTextOf({
        karyawan: { name: "Dewi" },
        leaveType: { name: "Cuti Melahirkan" },
        year: 2026,
        maxDaysPerYear: null,
        taken: "66",
        remaining: null,
      }),
    ).toBe("Sudah diambil 66 hari (2026)");
  });
});

describe("keadaan baris", () => {
  test("hanya PENDING tanpa persetujuan terbuka yang bisa diubah", () => {
    expect(isEditable(cuti())).toBe(true);
    expect(isEditable(cuti({ status: "APPROVED" }))).toBe(false);
    expect(
      isEditable(
        cuti({
          approval: {
            publicId: "a",
            code: "APR-1",
            status: "PENDING",
            currentOrder: 1,
            steps: [],
          },
        }),
      ),
    ).toBe(false);
  });

  test("batal hanya untuk APPROVED yang mulai SESUDAH hari ini", () => {
    const approved = cuti({ status: "APPROVED" });

    expect(isCancellable(approved, "2026-05-11")).toBe(true);
    expect(isCancellable(approved, "2026-05-12")).toBe(false);
    expect(isCancellable(approved, "2026-05-13")).toBe(false);
    expect(isCancellable(cuti(), "2026-05-11")).toBe(false);
  });

  test("sedang ditandatangani diturunkan dari approval, bukan dari status", () => {
    expect(statusTextOf(cuti(), CUTI_STATUS_LABEL)).toBe("Menunggu");
    expect(
      statusTextOf(
        cuti({
          approval: {
            publicId: "a",
            code: "APR-1",
            status: "PENDING",
            currentOrder: 1,
            steps: [],
          },
        }),
        CUTI_STATUS_LABEL,
      ),
    ).toBe("Sedang ditandatangani");
  });

  test("alasan penolakan dari kolom rejectedReason, penuh", () => {
    const long = "x".repeat(250);

    expect(rejectedTextOf(cuti())).toBeNull();
    expect(
      rejectedTextOf(cuti({ status: "REJECTED", rejectedReason: long })),
    ).toBe(long);
    expect(rejectedTextOf(cuti({ status: "REJECTED" }))).toContain(
      "tidak disertai catatan",
    );
  });

  test("rentang satu hari tidak ditulis dua kali", () => {
    expect(
      rangeTextOf("2026-05-12T00:00:00.000Z", "2026-05-12T00:00:00.000Z"),
    ).toBe("12 Mei 2026");
    expect(
      rangeTextOf("2026-05-12T00:00:00.000Z", "2026-05-16T00:00:00.000Z"),
    ).toBe("12 Mei 2026 – 16 Mei 2026");
  });
});

describe("pesan server ke field", () => {
  test("tumpang-tindih mendarat di startDate meski pesannya diawali 'Karyawan'", () => {
    expect(
      serverFieldError(
        "Karyawan ini sudah memiliki pengajuan cuti pada tanggal yang dipilih. Ubah tanggalnya atau batalkan pengajuan yang lama",
      ),
    ).toEqual({
      field: "startDate",
      message:
        "Karyawan ini sudah memiliki pengajuan cuti pada tanggal yang dipilih. Ubah tanggalnya atau batalkan pengajuan yang lama",
    });
  });

  test("jatah kurang dan rentang nol hari mendarat di startDate", () => {
    expect(
      serverFieldError(
        "Sisa Jatah Cuti Tidak Cukup. Cuti Tahunan Tahun 2026: Sisa 0 Hari, Diminta 2 Hari",
      )?.field,
    ).toBe("startDate");
    expect(
      serverFieldError(
        "Rentang Ini Tidak Memuat Satu Hari Kerja Pun. Seluruhnya Libur Mingguan Atau Hari Libur",
      )?.field,
    ).toBe("startDate");
  });

  test("penolakan yang bukan milik satu field tetap galat tingkat form", () => {
    expect(serverFieldError("Pengajuan Cuti Ini Sudah Diproses")).toBeNull();
    expect(
      serverFieldError(
        "Pengajuan Cuti Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
      ),
    ).toBeNull();
  });

  test("penolakan milik satu field tetap sampai ke fieldnya", () => {
    expect(serverFieldError("Karyawan Ini Sudah Tidak Aktif")?.field).toBe(
      "karyawanId",
    );
    expect(serverFieldError("Tipe Cuti Ini Sudah Tidak Aktif")?.field).toBe(
      "leaveTypeId",
    );
    expect(
      serverFieldError("Setengah Hari hanya berlaku untuk cuti satu hari")
        ?.field,
    ).toBe("length");
    expect(
      serverFieldError("Alasan tidak boleh lebih dari 250 karakter")?.field,
    ).toBe("reason");
  });
});

describe("kunci cache jatah", () => {
  // Tahun ikut di kunci, bukan hanya di query string: tanpa ia dua tahun
  // berbagi satu entri cache dan layar menampilkan jawaban tahun yang salah
  // walau permintaannya benar. Tidak bisa dibuktikan lewat render — tiap test
  // memakai QueryClient sendiri — jadi pendaftarannya dinyatakan langsung.
  test("tahun yang berbeda tidak pernah berbagi satu entri", () => {
    expect(cutiKeys.quota("1", "2", "2026")).not.toEqual(
      cutiKeys.quota("1", "2", "2027"),
    );
    expect(cutiKeys.quota("1", "2", "2026")).toEqual(
      cutiKeys.quota("1", "2", "2026"),
    );
  });

  test("tahun yang sama dengan karyawan berbeda juga terpisah", () => {
    expect(cutiKeys.quota("1", "2", "2026")).not.toEqual(
      cutiKeys.quota("3", "2", "2026"),
    );
  });
});

describe("tahun pembebanan", () => {
  test("diambil dari tanggal MULAI, termasuk yang melintasi tahun baru", () => {
    expect(chargedYearOf("2026-12-28T00:00:00.000Z")).toBe("2026");
    expect(chargedYearOf("2027-01-04")).toBe("2027");
  });

  test("tanggal kosong jatuh ke tahun berjalan, bukan ke string kosong", () => {
    expect(chargedYearOf("")).toMatch(/^\d{4}$/);
  });
});
