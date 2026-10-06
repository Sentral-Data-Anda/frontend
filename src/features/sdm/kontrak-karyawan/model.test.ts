import { describe, expect, test } from "bun:test";

import {
  EMPTY_KONTRAK_FORM,
  kontrakFormSchema,
  kontrakServerFieldError,
  phaseOf,
  toKontrakForm,
  toKontrakPayload,
  weeklyDayOffText,
  type KontrakFormValues,
} from "./model";
import { WEEKDAY_OPTIONS, type KontrakKaryawan } from "./types";

const VALID: KontrakFormValues = {
  karyawanId: "1",
  contractType: "TETAP",
  position: "Sekretaris",
  basicSalary: "4500000",
  effectiveFrom: "2026-05-12",
  effectiveTo: "",
  weeklyDayOff: ["1"],
  note: "",
};

const pathsOf = (values: KontrakFormValues) => {
  const parsed = kontrakFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

const messagesOf = (values: KontrakFormValues) => {
  const parsed = kontrakFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.message);
};

const CONTRACT: KontrakKaryawan = {
  id: 1,
  publicId: "ktr-1",
  code: "KTR-0001",
  karyawanId: 1,
  contractType: "KONTRAK",
  position: "Sekretaris",
  basicSalary: "4500000.00",
  effectiveFrom: "2026-05-12T00:00:00.000Z",
  effectiveTo: "2027-05-11T00:00:00.000Z",
  weeklyDayOff: [0, 1],
  note: "Perpanjangan",
  karyawan: { publicId: "kry-1", code: "KRY-0001", name: "Ani Wijaya" },
};

describe("skema kontrak karyawan", () => {
  test("isian lengkap diterima", () => {
    expect(pathsOf(VALID)).toEqual([]);
  });

  test("form kosong menolak setiap field wajib", () => {
    expect(pathsOf(EMPTY_KONTRAK_FORM).sort()).toEqual([
      "basicSalary",
      "effectiveFrom",
      "karyawanId",
      "position",
      "weeklyDayOff",
    ]);
  });

  test("jabatan maksimal 100 karakter", () => {
    expect(pathsOf({ ...VALID, position: "A".repeat(100) })).toEqual([]);
    expect(pathsOf({ ...VALID, position: "A".repeat(101) })).toEqual([
      "position",
    ]);
  });

  test("catatan maksimal 250 karakter", () => {
    expect(pathsOf({ ...VALID, note: "A".repeat(250) })).toEqual([]);
    expect(pathsOf({ ...VALID, note: "A".repeat(251) })).toEqual(["note"]);
  });

  test("gaji pokok nol dan negatif ditolak", () => {
    expect(pathsOf({ ...VALID, basicSalary: "0" })).toEqual(["basicSalary"]);
    expect(pathsOf({ ...VALID, basicSalary: "-1" })).toEqual(["basicSalary"]);
  });

  test("dua desimal diterima, tiga ditolak", () => {
    expect(pathsOf({ ...VALID, basicSalary: "4500000.55" })).toEqual([]);
    expect(pathsOf({ ...VALID, basicSalary: "4500000.555" })).toEqual([
      "basicSalary",
    ]);
  });

  test("gaji pokok di atas 13 digit ditolak", () => {
    expect(pathsOf({ ...VALID, basicSalary: "9999999999999" })).toEqual([]);
    expect(pathsOf({ ...VALID, basicSalary: "10000000000000" })).toEqual([
      "basicSalary",
    ]);
  });

  test("berlaku sampai sama hari diterima, sehari sebelum ditolak", () => {
    expect(pathsOf({ ...VALID, effectiveTo: "2026-05-12" })).toEqual([]);
    expect(pathsOf({ ...VALID, effectiveTo: "2026-05-11" })).toEqual([
      "effectiveTo",
    ]);
  });

  test("jenis kontrak di luar enum ditolak", () => {
    const parsed = kontrakFormSchema.safeParse({
      ...VALID,
      contractType: "MAGANG",
    });

    expect(parsed.success).toBe(false);
  });

  test("libur mingguan kosong ditolak dengan kalimatnya", () => {
    expect(pathsOf({ ...VALID, weeklyDayOff: [] })).toEqual(["weeklyDayOff"]);
    expect(messagesOf({ ...VALID, weeklyDayOff: [] })).toContain(
      "Libur mingguan wajib dipilih",
    );
  });

  test("satu hari dan tiga hari diterima", () => {
    expect(pathsOf({ ...VALID, weeklyDayOff: ["1"] })).toEqual([]);
    expect(pathsOf({ ...VALID, weeklyDayOff: ["1", "2", "0"] })).toEqual([]);
  });

  test("nilai hari di luar 0–6 tidak dihitung sebagai pilihan", () => {
    expect(pathsOf({ ...VALID, weeklyDayOff: ["7"] })).toEqual([
      "weeklyDayOff",
    ]);
  });
});

describe("pilihan hari", () => {
  test("Senin lebih dulu, Minggu terakhir", () => {
    expect(WEEKDAY_OPTIONS.map((option) => option.label)).toEqual([
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
      "Minggu",
    ]);
  });

  test("tidak ada hari yang terpilih lebih dulu", () => {
    expect(EMPTY_KONTRAK_FORM.weeklyDayOff).toEqual([]);
  });

  test("nilainya nomor getUTCDay, bukan indeks tampilan", () => {
    expect(WEEKDAY_OPTIONS.map((option) => option.value)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "0",
    ]);
  });

  test("teksnya urut Senin dulu, apa pun urutan datangnya", () => {
    expect(weeklyDayOffText([0, 1])).toBe("Senin, Minggu");
    expect(weeklyDayOffText([])).toBe("Belum diisi");
  });
});

describe("payload", () => {
  test("hari dikirim sebagai angka urut Senin dulu", () => {
    expect(
      toKontrakPayload({ ...VALID, weeklyDayOff: ["0", "2", "1"] })
        .weeklyDayOff,
    ).toEqual([1, 2, 0]);
  });

  test("tanggal kosong dan catatan kosong jadi null, bukan string kosong", () => {
    const payload = toKontrakPayload({ ...VALID, effectiveTo: "", note: "  " });

    expect(payload.effectiveTo).toBeNull();
    expect(payload.note).toBeNull();
  });

  test("tanggal dikirim YYYY-MM-DD", () => {
    expect(toKontrakPayload(VALID).effectiveFrom).toBe("2026-05-12");
  });

  test("karyawanId tetap dikirim walau PUT menolak yang berubah", () => {
    expect(toKontrakPayload(VALID).karyawanId).toBe(1);
  });

  test("detail dipetakan balik ke isian form", () => {
    expect(toKontrakForm(CONTRACT)).toEqual({
      karyawanId: "1",
      contractType: "KONTRAK",
      position: "Sekretaris",
      basicSalary: "4500000.00",
      effectiveFrom: "2026-05-12",
      effectiveTo: "2027-05-11",
      weeklyDayOff: ["1", "0"],
      note: "Perpanjangan",
    });
  });

  test("kontrak lama tanpa libur mingguan tetap ditolak sampai diisi", () => {
    const values = toKontrakForm({ ...CONTRACT, weeklyDayOff: [] });

    expect(pathsOf(values)).toEqual(["weeklyDayOff"]);
  });
});

describe("status berlaku", () => {
  const TODAY = "2026-06-01";

  test("mulai sesudah hari ini: akan datang", () => {
    expect(
      phaseOf(
        { effectiveFrom: "2026-06-02T00:00:00.000Z", effectiveTo: null },
        TODAY,
      ),
    ).toBe("UPCOMING");
  });

  test("berakhir sebelum hari ini: berakhir", () => {
    expect(
      phaseOf(
        {
          effectiveFrom: "2026-01-01T00:00:00.000Z",
          effectiveTo: "2026-05-31T00:00:00.000Z",
        },
        TODAY,
      ),
    ).toBe("ENDED");
  });

  test("hari ini termasuk, di kedua ujungnya", () => {
    expect(
      phaseOf(
        {
          effectiveFrom: "2026-06-01T00:00:00.000Z",
          effectiveTo: "2026-06-01T00:00:00.000Z",
        },
        TODAY,
      ),
    ).toBe("ACTIVE");
  });

  test("tanpa tanggal akhir dan sudah mulai: berlaku", () => {
    expect(
      phaseOf(
        { effectiveFrom: "2020-01-01T00:00:00.000Z", effectiveTo: null },
        TODAY,
      ),
    ).toBe("ACTIVE");
  });
});

describe("pesan server ke field", () => {
  test("tumpang-tindih jatuh ke tanggal mulai", () => {
    expect(
      kontrakServerFieldError(
        "Karyawan ini sudah memiliki kontrak pada periode yang dipilih. Ubah periodenya atau hapus kontrak yang lama",
      ),
    ).toEqual({
      field: "effectiveFrom",
      message:
        "Karyawan ini sudah memiliki kontrak pada periode yang dipilih. Ubah periodenya atau hapus kontrak yang lama",
    });
  });

  test("kontrak yang dipindahkan jatuh ke karyawan", () => {
    expect(
      kontrakServerFieldError(
        "Kontrak Ini Tidak Dapat Dipindahkan Ke Karyawan Lain. Hapus Kontrak Ini Dan Buat Yang Baru",
      )?.field,
    ).toBe("karyawanId");
  });

  test("libur mingguan jatuh ke fieldnya", () => {
    expect(
      kontrakServerFieldError("Mohon Lengkapi Libur Mingguan")?.field,
    ).toBe("weeklyDayOff");
  });

  test("berlaku sampai dibedakan dari berlaku dari", () => {
    expect(
      kontrakServerFieldError("Berlaku Sampai tidak boleh sebelum Berlaku Dari")
        ?.field,
    ).toBe("effectiveTo");
    expect(kontrakServerFieldError("Mohon Lengkapi Berlaku Dari")?.field).toBe(
      "effectiveFrom",
    );
  });

  test("pesan tak dikenal tidak dipaksa ke field mana pun", () => {
    expect(kontrakServerFieldError("Kesalahan server.")).toBeNull();
  });
});
