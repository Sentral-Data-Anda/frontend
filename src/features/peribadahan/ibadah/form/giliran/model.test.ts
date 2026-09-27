import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";

import {
  EMPTY_SETTINGS,
  assignHosts,
  batchRowErrors,
  defaultsFromLatest,
  giliranSettingsSchema,
  monthlyLabel,
  previewWarnings,
  rotationDates,
  rowProblems,
  toBatchRows,
  type GiliranSettings,
  type PreviewRow,
} from "./model";

const SETTINGS: GiliranSettings = {
  typeIbadahId: "6",
  zoneChurchId: "1",
  startTime: "19:00",
  endTime: "20:30",
  startDate: "2026-10-08",
  pattern: "WEEKLY",
  count: "4",
};

const row = (date: string, hostId: string, isTicked = true): PreviewRow => ({
  date,
  hostId,
  isTicked,
});

describe("rotationDates", () => {
  test("mingguan: tiap 7 hari dari tanggal mulai", () => {
    expect(rotationDates("2026-10-08", "WEEKLY", 4)).toEqual([
      "2026-10-08",
      "2026-10-15",
      "2026-10-22",
      "2026-10-29",
    ]);
  });

  test("bulanan: Kamis ke-2 tiap bulan, melintasi tahun", () => {
    expect(monthlyLabel("2026-10-08")).toBe("Kamis ke-2");
    expect(rotationDates("2026-10-08", "MONTHLY", 5)).toEqual([
      "2026-10-08",
      "2026-11-12",
      "2026-12-10",
      "2027-01-14",
      "2027-02-11",
    ]);
  });

  test("bulanan: ke-4 tetap di bulan yang sama", () => {
    expect(rotationDates("2026-09-28", "MONTHLY", 3)).toEqual([
      "2026-09-28",
      "2026-10-26",
      "2026-11-23",
    ]);
  });
});

describe("giliranSettingsSchema", () => {
  const issuesOf = (values: GiliranSettings) => {
    const parsed = giliranSettingsSchema.safeParse(values);

    return parsed.success
      ? {}
      : Object.fromEntries(
          parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
        );
  };

  test("wajib dan jumlah 1–60", () => {
    expect(issuesOf({ ...EMPTY_SETTINGS, count: "0" })).toEqual({
      typeIbadahId: "Pilih tipe ibadah.",
      zoneChurchId: "Pilih wilayah.",
      startTime: "Isi jam mulai.",
      startDate: "Tanggal wajib diisi",
      count: "Isi 1 sampai 60.",
    });
    expect(issuesOf({ ...SETTINGS, count: "61" })).toEqual({
      count: "Isi 1 sampai 60.",
    });
    expect(issuesOf({ ...SETTINGS, count: "60" })).toEqual({});
  });

  test("bulanan menolak tanggal 29–31; mingguan menerimanya", () => {
    const late = { ...SETTINGS, startDate: "2026-10-29" };

    expect(issuesOf({ ...late, pattern: "MONTHLY" })).toEqual({
      startDate: "Untuk pola bulanan pilih tanggal 1–28.",
    });
    expect(issuesOf(late)).toEqual({});
  });

  test("jam selesai harus sesudah jam mulai", () => {
    expect(issuesOf({ ...SETTINGS, endTime: "18:00" })).toEqual({
      endTime: "Jam selesai harus sesudah jam mulai.",
    });
  });
});

describe("defaultsFromLatest", () => {
  test("ibadah terakhir + 7, tidak sebelum hari ini", () => {
    const latest = {
      date: "2026-10-08T00:00:00.000Z",
      startTime: "19:00",
      endTime: "20:30",
    };

    expect(defaultsFromLatest(latest, "2026-09-27")).toEqual({
      startTime: "19:00",
      endTime: "20:30",
      startDate: "2026-10-15",
    });
    expect(defaultsFromLatest(latest, "2026-11-01").startDate).toBe(
      "2026-11-01",
    );
    expect(defaultsFromLatest(null, "2026-09-27")).toEqual({
      startTime: "",
      endTime: "",
      startDate: "2026-09-27",
    });
  });
});

describe("assignHosts", () => {
  const dates = ["d1", "d2", "d3", "d4", "d5"];

  test("bergilir dan berulang bila saran lebih sedikit", () => {
    expect(
      assignHosts(dates, [true, true, true, true, true], ["a", "b"]).map(
        (item) => item.hostId,
      ),
    ).toEqual(["a", "b", "a", "b", "a"]);
  });

  test("baris tidak dicentang tidak memakai giliran", () => {
    expect(
      assignHosts(dates, [true, false, true, true, false], ["a", "b", "c"]),
    ).toEqual([
      row("d1", "a"),
      row("d2", "", false),
      row("d3", "b"),
      row("d4", "c"),
      row("d5", "", false),
    ]);
  });
});

describe("previewWarnings", () => {
  test("sudah ada, tuan rumah ganda, tanggal ganda", () => {
    const rows = [
      row("2026-10-01", "1"),
      row("2026-10-08", "2"),
      row("2026-10-08", "3"),
      row("2026-10-22", "1"),
      row("2026-10-29", "2", false),
    ];
    const warnings = previewWarnings(rows, new Set(["2026-10-01"]));

    expect(warnings.map((item) => item.isExisting)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(warnings[0].hostWarning).toBe(
      "Juga tuan rumah pada Kamis, 22 Okt 2026",
    );
    expect(warnings[1].hostWarning).toBeNull();
    expect(warnings[4].hostWarning).toBeNull();
    expect(warnings.map((item) => Boolean(item.dateError))).toEqual([
      false,
      true,
      true,
      false,
      false,
    ]);
  });

  test("tanggal ganda dengan baris tidak dicentang bukan penghalang", () => {
    const warnings = previewWarnings(
      [row("2026-10-08", "1"), row("2026-10-08", "2", false)],
      new Set(),
    );

    expect(warnings[0].dateError).toBeNull();
  });
});

describe("rowProblems", () => {
  test("tanpa tuan rumah, tanggal ganda, alamat belum termuat", () => {
    const rows = [
      row("2026-10-01", ""),
      row("2026-10-08", "2"),
      row("2026-10-08", "3"),
      row("2026-10-15", "4"),
      row("2026-10-22", "", false),
    ];
    const problems = rowProblems(rows, previewWarnings(rows, new Set()), {
      "2": "Jl. Dua",
      "3": "Jl. Tiga",
    });

    expect([...problems]).toEqual([
      [0, { field: "host", message: "Pilih tuan rumah." }],
      [1, { field: "date", message: "Tanggal ini sudah dipakai baris lain." }],
      [2, { field: "date", message: "Tanggal ini sudah dipakai baris lain." }],
      [3, { field: "host", message: "Alamat belum termuat." }],
    ]);
  });
});

const ROWS = [
  row("2026-10-08", "1"),
  row("2026-10-15", "4", false),
  row("2026-10-22", "8"),
  row("2026-10-29", "13"),
];

const ADDRESSES = {
  "1": "Jl. Satu",
  "8": "Jl. Delapan",
  "13": "Jl. Tiga Belas",
};

describe("toBatchRows", () => {
  test("hanya tercentang, body POST lengkap", () => {
    const { body, previewIndexOf } = toBatchRows(SETTINGS, ROWS, ADDRESSES);

    expect(previewIndexOf).toEqual([0, 2, 3]);
    expect(body).toHaveLength(3);
    expect(body[1]).toEqual({
      typeIbadahId: 6,
      date: "2026-10-22",
      startTime: "19:00",
      endTime: "20:30",
      theme: null,
      bibleVerse: null,
      preacher: null,
      placeType: "RUMAH_JEMAAT",
      hostKeluargaId: 8,
      placeName: null,
      address: "Jl. Delapan",
      zoneChurchId: 1,
      roomId: null,
      bapelId: null,
      jadwalPelayanId: null,
      maleCount: 0,
      femaleCount: 0,
      childCount: 0,
      note: null,
    });
    expect(
      toBatchRows({ ...SETTINGS, endTime: "" }, ROWS, ADDRESSES).body[0]
        .endTime,
    ).toBeNull();
  });
});

describe("batchRowErrors", () => {
  const { previewIndexOf } = toBatchRows(SETTINGS, ROWS, ADDRESSES);

  test("indeks body dipetakan ke baris pratinjau, melompati baris tidak dicentang", () => {
    const failure = batchRowErrors(
      new FetchError(400, "Keluarga Tuan Rumah Tidak Ditemukan", [
        {
          path: "rows.1.hostKeluargaId",
          message: "Keluarga Tuan Rumah Tidak Ditemukan",
        },
        { path: "rows.2.date", message: "Mohon Lengkapi Tanggal Ibadah" },
        { path: "rows.2.startTime", message: "Mohon Lengkapi Jam Mulai" },
      ]),
      previewIndexOf,
      ROWS,
      "Ibadah Wilayah",
    );

    expect([...failure.rowErrors]).toEqual([
      [
        2,
        {
          field: "host",
          message: "Keluarga ini sudah dihapus. Pilih keluarga lain.",
        },
      ],
      [3, { field: "date", message: "Mohon Lengkapi Tanggal Ibadah" }],
    ]);
    expect(failure.root).toBeNull();
    expect(failure.isRace).toBe(false);
  });

  test("path rows tanpa indeks menjadi galat root", () => {
    const failure = batchRowErrors(
      new FetchError(400, "Maksimal 60 Ibadah Dalam Satu Kali Simpan", [
        { path: "rows", message: "Maksimal 60 Ibadah Dalam Satu Kali Simpan" },
      ]),
      previewIndexOf,
      ROWS,
      "Ibadah Wilayah",
    );

    expect(failure.rowErrors.size).toBe(0);
    expect(failure.root).toBe("Maksimal 60 Ibadah Dalam Satu Kali Simpan");
  });

  test("Sama Dengan Baris n menjadi teks bertanggal; duplikat DB diterjemahkan", () => {
    const failure = batchRowErrors(
      new FetchError(400, "x", [
        { path: "rows.2.startTime", message: "Ibadah Ini Sama Dengan Baris 2" },
        {
          path: "rows.0.startTime",
          message:
            "Ibadah dengan tipe, tanggal, jam mulai dan wilayah yang sama sudah tercatat. Isi Wilayah jika ibadah ini untuk wilayah yang berbeda",
        },
      ]),
      previewIndexOf,
      ROWS,
      "Ibadah Wilayah",
    );

    expect(failure.rowErrors.get(3)?.message).toBe(
      "Sama dengan baris Kamis, 22 Okt 2026.",
    );
    expect(failure.rowErrors.get(0)?.message).toBe(
      "Sudah ada ibadah pada tanggal dan jam ini. Ganti tanggal atau lewati baris ini.",
    );
  });

  test("409 tanpa issues = berlomba; 500 dan jaringan = root", () => {
    expect(
      batchRowErrors(
        new FetchError(409, "sudah tercatat"),
        previewIndexOf,
        ROWS,
        "",
      ),
    ).toEqual({ rowErrors: new Map(), root: null, isRace: true });
    expect(
      batchRowErrors(
        new FetchError(500, "Kesalahan server."),
        previewIndexOf,
        ROWS,
        "",
      ).root,
    ).toBe("Kesalahan server.");
    expect(
      batchRowErrors(new TypeError("fetch"), previewIndexOf, ROWS, "").root,
    ).toBe("Tidak dapat menghubungi server. Periksa koneksi Anda.");
  });
});
