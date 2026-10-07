import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import {
  EMPTY_LOAN_FORM,
  batchRowErrors,
  bookingTimeOf,
  clashSummary,
  isClash,
  loanFormSchema,
  loanStatusOf,
  previewRowsOf,
  repeatDatesOf,
  toBatchRows,
  toLoanApiFilters,
  toLoanBody,
  type LoanFormValues,
} from "./model";

const VALUES: LoanFormValues = {
  ...EMPTY_LOAN_FORM,
  roomId: "2",
  date: "2026-10-01",
  startTime: "19:00",
  endTime: "21:00",
  purpose: "  Latihan paduan suara ",
  jemaatId: "2",
};

const issuesOf = (values: LoanFormValues) => {
  const parsed = loanFormSchema.safeParse(values);

  return parsed.success
    ? {}
    : Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      );
};

describe("loanFormSchema", () => {
  test("wajib dan batas panjang keperluan", () => {
    expect(issuesOf(EMPTY_LOAN_FORM)).toEqual({
      roomId: "Pilih ruang",
      date: "Tanggal wajib diisi",
      startTime: "Isi jam mulai",
      endTime: "Isi jam selesai",
      purpose: "Isi keperluan",
      jemaatId: "Pilih peminjam",
    });
    expect(issuesOf({ ...VALUES, purpose: "x".repeat(151) })).toEqual({
      purpose: "Keperluan maksimal 150 karakter",
    });
    expect(issuesOf({ ...VALUES, purpose: "x".repeat(150) })).toEqual({});
  });

  test("jam selesai harus setelah jam mulai", () => {
    expect(issuesOf({ ...VALUES, endTime: "19:00" })).toEqual({
      endTime: "Jam selesai harus setelah jam mulai",
    });
  });

  test("tiap minggu: hari wajib; sampai wajib, sesudah tanggal mulai, paling banyak 26", () => {
    const weekly = { ...VALUES, repeat: "WEEKLY" as const, weekdays: ["3"] };

    expect(issuesOf({ ...weekly, weekdays: [], until: "2026-10-15" })).toEqual({
      weekdays: "Pilih minimal satu hari",
    });
    expect(issuesOf(weekly)).toEqual({ until: "Isi tanggal akhir" });
    expect(issuesOf({ ...weekly, until: "2026-10-01" })).toEqual({
      until: "Tanggal akhir harus sesudah tanggal mulai",
    });
    expect(issuesOf({ ...weekly, until: "2027-03-25" })).toEqual({});
    expect(repeatDatesOf({ ...weekly, until: "2027-03-25" })).toHaveLength(26);
    expect(issuesOf({ ...weekly, until: "2027-04-01" })).toEqual({
      until: "Paling banyak 26 tanggal. Majukan tanggal akhir.",
    });
    expect(
      repeatDatesOf({ ...weekly, weekdays: ["1", "3"], until: "2026-10-15" }),
    ).toEqual([
      "2026-10-01",
      "2026-10-06",
      "2026-10-08",
      "2026-10-13",
      "2026-10-15",
    ]);
  });
});

describe("payload", () => {
  test("tanggal YYYY-MM-DD, id angka, keperluan di-trim, bapelId hanya bila diisi", () => {
    expect(toLoanBody(VALUES)).toEqual({
      roomId: 2,
      date: "2026-10-01",
      startTime: "19:00",
      endTime: "21:00",
      purpose: "Latihan paduan suara",
      jemaatId: 2,
    });
    expect(toLoanBody({ ...VALUES, bapelId: "5" }).bapelId).toBe(5);
  });

  test("toBatchRows: hanya yang tercentang, dengan peta indeks ke baris pratinjau", () => {
    const rows = previewRowsOf(
      ["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22"],
      [
        { date: "2026-10-01", clashes: [] },
        {
          date: "2026-10-08",
          clashes: [
            {
              kind: "IBADAH",
              code: "IBD-1",
              name: "Ibadah Minggu I",
              startTime: "18:00",
              endTime: "20:00",
            },
          ],
        },
        { date: "2026-10-15", clashes: [] },
        { date: "2026-10-22", clashes: [] },
      ],
      new Set(["2026-10-15"]),
    );

    expect(rows.map((row) => row.isTicked)).toEqual([true, false, false, true]);

    const batch = toBatchRows(VALUES, rows);

    expect(batch.previewIndexOf).toEqual([0, 3]);
    expect(batch.rows.map((row) => row.date)).toEqual([
      "2026-10-01",
      "2026-10-22",
    ]);
  });
});

describe("bentrok", () => {
  test("isClash setengah terbuka: bersebelahan tidak bentrok", () => {
    const morning = { startTime: "10:00", endTime: "12:00" };

    expect(isClash(morning, { startTime: "12:00", endTime: "14:00" })).toBe(
      false,
    );
    expect(isClash(morning, { startTime: "08:00", endTime: "10:00" })).toBe(
      false,
    );
    expect(isClash(morning, { startTime: "11:00", endTime: "13:00" })).toBe(
      true,
    );
  });

  test("ringkasan bentrok: jenis tidak diulang, +n lainnya", () => {
    expect(clashSummary([])).toBe("Tersedia");
    expect(
      clashSummary([
        {
          kind: "IBADAH",
          code: "a",
          name: "Ibadah Minggu I",
          startTime: "07:00",
          endTime: "09:00",
        },
        {
          kind: "LOAN",
          code: "b",
          name: "Rapat",
          startTime: "08:00",
          endTime: "09:00",
        },
      ]),
    ).toBe("Bentrok: Ibadah Minggu I 07.00–09.00 +1 lainnya");
    expect(
      clashSummary([
        {
          kind: "LOAN",
          code: "b",
          name: "Rapat",
          startTime: "08:00",
          endTime: "09:00",
        },
      ]),
    ).toBe("Bentrok: Peminjaman Rapat 08.00–09.00");
  });
});

describe("loanStatusOf", () => {
  const row = {
    date: "2026-10-01T00:00:00.000Z",
    startTime: "18:00",
    endTime: "20:00",
  };
  const at = (wib: string) => new Date(`${wib}+07:00`);

  test("batas waktu WIB", () => {
    expect(loanStatusOf(row, at("2026-09-30T23:59:00"))).toBe("UPCOMING");
    expect(loanStatusOf(row, at("2026-10-01T17:59:00"))).toBe("UPCOMING");
    expect(loanStatusOf(row, at("2026-10-01T18:00:00"))).toBe("ONGOING");
    expect(loanStatusOf(row, at("2026-10-01T19:59:00"))).toBe("ONGOING");
    expect(loanStatusOf(row, at("2026-10-01T20:00:00"))).toBe("DONE");
    expect(loanStatusOf(row, at("2026-10-02T00:00:00"))).toBe("DONE");
  });
});

describe("toLoanApiFilters", () => {
  test("Periode bawaan = Mendatang (startDate saja); bulan = monthRange", () => {
    expect(toLoanApiFilters({}, "2026-09-28")).toEqual({
      startDate: "2026-09-28",
      endDate: "",
      roomId: "",
      bapelId: "",
    });
    expect(
      toLoanApiFilters({ bulan: "2026-02", ruang: "2", bapel: "5" }),
    ).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      roomId: "2",
      bapelId: "5",
    });
  });
});

describe("batchRowErrors", () => {
  const rows = [
    { date: "2026-10-01" },
    { date: "2026-10-08" },
    { date: "2026-10-15" },
    { date: "2026-10-22" },
  ];
  const previewIndexOf = [0, 2, 3];

  test("indeks body → baris pratinjau; Bentrok Dengan Baris n → tanggal; field bersama → form", () => {
    const failure = batchRowErrors(
      new FetchError(400, "x", [
        {
          path: "rows.1.startTime",
          message: "Ruang Sudah Dipakai Event Bazar Pukul 09.00–15.00",
        },
        { path: "rows.2.startTime", message: "Bentrok Dengan Baris 1" },
        { path: "rows.0.roomId", message: "Ruang Tidak Aktif" },
        { path: "rows.2.roomId", message: "Ruang Tidak Aktif" },
      ]),
      previewIndexOf,
      rows,
    );

    expect([...failure.rowErrors]).toEqual([
      [2, "Ruang Sudah Dipakai Event Bazar Pukul 09.00–15.00"],
      [3, "Bentrok dengan Kam, 1 Okt 2026"],
    ]);
    expect([...failure.fieldErrors]).toEqual([["roomId", "Ruang Tidak Aktif"]]);
    expect(failure.root).toBeNull();
    expect(failure.isRace).toBe(false);
  });

  test("rows → root; 409 tanpa issues = balapan; jaringan = root", () => {
    expect(
      batchRowErrors(
        new FetchError(400, "Maksimal 26 Peminjaman Dalam Satu Kali Simpan", [
          {
            path: "rows",
            message: "Maksimal 26 Peminjaman Dalam Satu Kali Simpan",
          },
        ]),
        previewIndexOf,
        rows,
      ).root,
    ).toBe("Maksimal 26 Peminjaman Dalam Satu Kali Simpan");
    expect(
      batchRowErrors(new FetchError(409, "Ruang Sudah Dipakai"), [], rows)
        .isRace,
    ).toBe(true);
    expect(
      batchRowErrors(new FetchError(500, "Kesalahan server."), [], rows).root,
    ).toBe("Kesalahan server.");
    expect(batchRowErrors(new TypeError("fetch"), [], rows).root).toBe(
      "Tidak dapat menghubungi server. Periksa koneksi Anda.",
    );
  });
});

describe("bookingTimeOf", () => {
  const at = (
    kind: "LOAN" | "IBADAH" | "EVENT",
    startTime: string,
    endTime: string,
  ) => bookingTimeOf({ kind, startTime, endTime });

  test("event ber-23.59 tidak mengarang jam selesai", () => {
    const cases = [
      [at("EVENT", "09:00", "23:59"), "mulai 09.00"],
      [at("EVENT", "00:00", "23:59"), "sepanjang hari"],
      [at("EVENT", "18:30", "23:59"), "mulai 18.30"],
    ];

    expect(cases).toHaveLength(3);
    for (const [shown, expected] of cases) {
      expect(shown).toBe(expected);
      expect(shown).not.toMatch(/23[.:]59/);
    }
  });

  test("jam selesai sungguhan tetap tampil", () => {
    expect(at("EVENT", "09:00", "15:00")).toBe("09.00–15.00");
    expect(at("LOAN", "20:00", "23:59")).toBe("20.00–23.59");
    expect(at("IBADAH", "22:00", "23:59")).toBe("22.00–23.59");
  });
});
