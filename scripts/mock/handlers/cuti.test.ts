import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { addDays, todayJakarta } from "../../../src/lib/date";
import type { MockAction } from "../kit";

import {
  LEAVE_REQUEST,
  cutiMock,
  leaveRequestSeed,
  resetLeaveRequests,
} from "./cuti";
import { hariLiburMock } from "./hari-libur";
import { resetKaryawanRows } from "./karyawan";
import { resetKontrakKaryawan } from "./kontrak-karyawan";
import { resetLeaveTypes } from "./tipe-cuti";

// Pedoman §7.2: dua larik, dua reset milik modul penyemainya. Berkas ini tidak
// menyimpan snapshot sendiri — snapshot yang diambil saat berkas dimuat
// merekam apa pun yang berkas sebelumnya tinggalkan.
const SEED = leaveRequestSeed();

const TODAY = todayJakarta();

const YEAR = Number(TODAY.slice(0, 4));

const FLAGS = [
  "MOCK_EMPTY",
  "MOCK_500",
  "MOCK_CUTI_SAVE_ERROR",
  "MOCK_CUTI_OVERLAP",
] as const;

// Empat larik, empat reset milik modul penyemainya masing-masing. Kontrak ikut
// sejak mock menghitung libur mingguan dari sana, dan roster karyawan ikut
// sejak `karyawan.ts` memilikinya — layar Karyawan menulisinya.
const onReset = () => {
  resetLeaveTypes();
  resetKaryawanRows();
  resetKontrakKaryawan();
  resetLeaveRequests();
};

beforeEach(onReset);

afterEach(() => {
  onReset();
  for (const flag of FLAGS) delete process.env[flag];
});

const ALL: MockAction[] = ["VIEW", "CREATE", "UPDATE", "DELETE"];

const onCall = async (
  method: string,
  target: string,
  options: {
    body?: unknown;
    granted?: Partial<Record<MenuSlug, MockAction[]>>;
  } = {},
) => {
  const url = new URL(`http://localhost:5007/api/v1${target}`);
  const granted = options.granted ?? { [MENU.LEAVE]: ALL };

  const response = await cutiMock({
    request: new Request(url, {
      method,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: { "content-type": "application/json" },
    }),
    url,
    path: url.pathname.replace("/api/v1", ""),
    method,
    can: (slug, action) => Boolean(granted[slug]?.includes(action)),
    isAdmin: false,
    sessionCode: "JMT-0001",
  });

  if (!response) return null;

  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
};

// Tanggal TETAP, bukan relatif terhadap hari ini: begitu libur mingguan ikut
// dihitung, rentang yang bergeser tiap hari memberi jumlah hari yang berbeda
// tiap hari. Karyawan 2 libur Senin+Selasa; 10–11 Maret 2027 Rabu–Kamis.
const VALID = {
  karyawanId: 2,
  leaveTypeId: 4,
  startDate: "2027-03-10",
  endDate: "2027-03-11",
  halfDay: false,
  reason: "Menikah",
};

describe("benih", () => {
  test("reset mengembalikan benih yang sebenarnya, bukan larik kosong", () => {
    LEAVE_REQUEST.length = 0;
    resetLeaveRequests();

    expect(LEAVE_REQUEST.length).toBe(SEED.length);
    expect(LEAVE_REQUEST.length).toBeGreaterThan(0);
    expect(LEAVE_REQUEST.map((row) => row.code)).toEqual(
      SEED.map((row) => row.code),
    );
  });
});

describe("daftar", () => {
  test("urut startDate menurun, dan kosong menjawab 404 (konvensi rumah)", async () => {
    const result = await onCall("GET", "/cuti?limit=100");
    const rows = result?.body.data as { startDate: string }[];

    expect(result?.status).toBe(200);
    expect(rows.map((row) => row.startDate)).toEqual(
      [...rows].map((row) => row.startDate).sort((a, b) => b.localeCompare(a)),
    );

    process.env.MOCK_EMPTY = "1";
    const empty = await onCall("GET", "/cuti");
    expect(empty?.status).toBe(404);
    expect(empty?.body.error).toBe("Pengajuan Cuti Tidak Ditemukan");
  });

  test("status divalidasi seperti z.enum be-sada", async () => {
    expect((await onCall("GET", "/cuti?status=PENDING"))?.status).toBe(200);
    expect((await onCall("GET", "/cuti?status=PENDINGG"))?.status).toBe(400);
  });

  test("saring karyawan dan tipe cuti", async () => {
    const byPerson = await onCall("GET", "/cuti?karyawanId=1&limit=100");
    const rows = byPerson?.body.data as { karyawanId: number }[];

    expect(rows.every((row) => row.karyawanId === 1)).toBe(true);
    expect(rows.length).toBe(SEED.filter((row) => row.karyawanId === 1).length);
  });

  test("setiap baris membawa karyawan dan tipe cuti yang sudah di-resolve", async () => {
    const rows = (await onCall("GET", "/cuti?limit=100"))?.body.data as {
      karyawan: { name: string; position: string };
      leaveType: {
        name: string;
        isPaid: boolean;
        maxDaysPerYear: number | null;
      };
    }[];

    expect(rows.every((row) => Boolean(row.karyawan?.name))).toBe(true);
    expect(rows.every((row) => Boolean(row.leaveType?.name))).toBe(true);
    expect(rows.some((row) => row.leaveType.maxDaysPerYear === null)).toBe(
      true,
    );
  });
});

describe("gerbang izin per rute", () => {
  test("tanpa LEAVE VIEW: daftar, detail, dan sisa jatah ditolak", async () => {
    const granted = { [MENU.LEAVE_TYPE]: ALL };

    expect((await onCall("GET", "/cuti", { granted }))?.status).toBe(403);
    expect(
      (await onCall("GET", `/cuti/CTI-${YEAR}-0001`, { granted }))?.status,
    ).toBe(403);
    expect(
      (
        await onCall("GET", "/cuti/sisa-jatah?karyawanId=1&leaveTypeId=1", {
          granted,
        })
      )?.status,
    ).toBe(403);
  });

  test("pengajuan butuh UPDATE, bukan CREATE", async () => {
    expect(
      (
        await onCall("POST", `/cuti/CTI-${YEAR}-0006/pengajuan`, {
          granted: { [MENU.LEAVE]: ["VIEW", "CREATE"] },
        })
      )?.status,
    ).toBe(403);
    expect(
      (
        await onCall("POST", `/cuti/CTI-${YEAR}-0006/pengajuan`, {
          granted: { [MENU.LEAVE]: ["VIEW", "UPDATE"] },
        })
      )?.status,
    ).toBe(201);
  });

  test("batal butuh DELETE, bukan UPDATE", async () => {
    const code = SEED.find(
      (row) => row.status === "APPROVED" && row.startDate > TODAY,
    )?.code;

    expect(
      (
        await onCall("PUT", `/cuti/${code ?? `CTI-${YEAR}-0001`}/batal`, {
          granted: { [MENU.LEAVE]: ["VIEW", "UPDATE"] },
        })
      )?.status,
    ).toBe(403);
  });
});

describe("sisa jatah tidak pernah negatif", () => {
  test("karyawan yang melewati jatah mendapat remaining '0', bukan minus", async () => {
    const result = await onCall(
      "GET",
      "/cuti/sisa-jatah?karyawanId=1&leaveTypeId=1",
    );
    const data = result?.body.data as {
      maxDaysPerYear: number;
      taken: string;
      remaining: string;
    };

    expect(result?.status).toBe(200);
    expect(Number(data.taken)).toBeGreaterThan(data.maxDaysPerYear);
    expect(data.remaining).toBe("0");
    expect(Number(data.remaining)).toBeGreaterThanOrEqual(0);
  });

  test("penjelasan jujurnya ikut di kawat: taken dan maxDaysPerYear", async () => {
    const data = (
      await onCall("GET", "/cuti/sisa-jatah?karyawanId=1&leaveTypeId=1")
    )?.body.data as Record<string, unknown>;

    expect(data.taken).toBe("14");
    expect(data.maxDaysPerYear).toBe(12);
    expect(data.year).toBe(YEAR);
    expect((data.karyawan as { name: string }).name).toBeTruthy();
    expect((data.leaveType as { name: string }).name).toBeTruthy();
  });

  test("tipe tanpa batas: remaining TETAP null, tidak dilantai jadi 0", async () => {
    // Benihnya relatif terhadap hari ini, jadi pada 31 Des ia jatuh di tahun
    // berikutnya: tahun yang dinilai diambil dari benihnya, bukan dari kalender.
    const seededYear = LEAVE_REQUEST.find(
      (item) => item.karyawanId === 4 && item.leaveTypeId === 3,
    )?.startDate.slice(0, 4);

    const data = (
      await onCall(
        "GET",
        `/cuti/sisa-jatah?karyawanId=4&leaveTypeId=3&year=${seededYear}`,
      )
    )?.body.data as { maxDaysPerYear: null; taken: string; remaining: null };

    expect(data.maxDaysPerYear).toBeNull();
    expect(data.remaining).toBeNull();
    expect(Number(data.taken)).toBeGreaterThan(0);
  });

  test("sisa yang belum habis dilaporkan apa adanya", async () => {
    const data = (
      await onCall("GET", "/cuti/sisa-jatah?karyawanId=2&leaveTypeId=2")
    )?.body.data as {
      maxDaysPerYear: number;
      taken: string;
      remaining: string;
    };

    expect(data.remaining).toBe(
      String(data.maxDaysPerYear - Number(data.taken)),
    );
    expect(Number(data.remaining)).toBeGreaterThan(0);
  });

  test("yang menunggu ikut memakai jatah; yang dibatalkan mengembalikannya", async () => {
    const before = (
      await onCall("GET", "/cuti/sisa-jatah?karyawanId=3&leaveTypeId=1")
    )?.body.data as { taken: string };

    // CTI-0007 milik karyawan 3, tipe 1, berstatus CANCELLED di benih.
    expect(before.taken).toBe("0");

    const pending = LEAVE_REQUEST.find(
      (row) => row.code === `CTI-${YEAR}-0007`,
    );
    if (pending) pending.status = "PENDING";

    const after = (
      await onCall("GET", "/cuti/sisa-jatah?karyawanId=3&leaveTypeId=1")
    )?.body.data as { taken: string };

    expect(after.taken).toBe("2");
  });

  test("lantai TIDAK melonggarkan penolakan: jatah yang habis tetap menolak", async () => {
    const result = await onCall("POST", "/cuti", {
      body: {
        karyawanId: 1,
        leaveTypeId: 1,
        startDate: `${YEAR}-11-02`,
        endDate: `${YEAR}-11-03`,
        halfDay: false,
        reason: "Istirahat",
      },
    });

    expect(result?.status).toBe(400);
    expect(String(result?.body.error)).toContain("Sisa Jatah Cuti Tidak Cukup");
    expect(String(result?.body.error)).toContain("Sisa 0 Hari");
    expect(String(result?.body.error)).not.toContain("-3");
  });
});

// Aturan §2 fase ini: hari cuti = hari dalam rentang − hari libur. Mock dan
// ringkasan form membaca kalender yang SAMA (`/hari-libur/kalender`), jadi
// angka yang disimpan dan angka yang dipratinjau tidak bisa berbeda.
describe("hari libur memotong hari cuti", () => {
  // Karyawan 3 libur Sabtu+Minggu (kontrak yang berlaku 2027), dan 27 Sep
  // adalah HUT Gereja yang berulang. Rentang 25–29 Sep 2027 memuat keduanya:
  // Sab, Min, HUT Senin, lalu Selasa dan Rabu kerja.
  const RECURRING = {
    karyawanId: 3,
    leaveTypeId: 2,
    startDate: "2027-09-25",
    endDate: "2027-09-29",
    halfDay: false,
    reason: "Rangkaian HUT gereja",
  };

  test("libur mingguan DAN hari libur berulang sama-sama terpotong", async () => {
    const result = await onCall("POST", "/cuti", { body: RECURRING });

    expect(result?.status).toBe(201);
    expect((result?.body.data as { totalDays: string }).totalDays).toBe("2");
  });

  test("karyawan tanpa libur mingguan terisi dihitung penuh hari kalender", async () => {
    // Karyawan 4: kontraknya ada tapi `weeklyDayOff` kosong — baris pra-migrasi.
    const result = await onCall("POST", "/cuti", {
      body: {
        karyawanId: 4,
        leaveTypeId: 3,
        startDate: "2027-09-25",
        endDate: "2027-09-29",
        halfDay: false,
        reason: "Rangkaian HUT gereja",
      },
    });

    expect(result?.status).toBe(201);
    // 5 hari kalender − 1 hari libur, nol libur mingguan yang dikurangi.
    expect((result?.body.data as { totalDays: string }).totalDays).toBe("4");
  });

  test("paritas: yang disimpan sama dengan yang kalender laporkan", async () => {
    const saved = Number(
      (
        (await onCall("POST", "/cuti", { body: RECURRING }))?.body.data as {
          totalDays: string;
        }
      ).totalDays,
    );

    // Hitungan ringkasan form, dari endpoint yang sama, tanpa menyalin
    // logikanya: hari kalender dikurangi baris kalender di dalam rentang.
    const calendar = await hariLiburMock({
      request: new Request("http://mock/api/v1/hari-libur/kalender"),
      url: new URL(
        `http://mock/api/v1/hari-libur/kalender?from=${RECURRING.startDate}&to=${RECURRING.endDate}`,
      ),
      path: "/hari-libur/kalender",
      method: "GET",
      can: () => true,
      isAdmin: false,
      sessionCode: "JMT-0001",
    });
    const holidays = ((await calendar!.json()) as { data: unknown[] }).data;

    expect(holidays.length).toBe(1);
    // 5 hari kalender − 1 hari libur − 2 hari libur mingguan (Sab, Min).
    expect(saved).toBe(5 - holidays.length - 2);
  });

  // M17: tanpa test ini, mengabaikan rentang berlaku kontrak lolos — benihnya
  // kebetulan memberi libur mingguan yang sama di kedua kontrak tiap orang,
  // jadi "kontrak mana" tidak kelihatan dari jumlah harinya. Yang
  // membedakannya adalah tanggal yang BELUM punya kontrak sama sekali.
  test("tanggal sebelum kontrak mana pun berlaku dihitung penuh", async () => {
    // Karyawan 3 baru berkontrak 1 Maret 2026; 3–4 Januari 2026 Sabtu–Minggu.
    // Dengan kontraknya ia nol hari kerja, tanpa kontraknya dua hari penuh.
    const result = await onCall("POST", "/cuti", {
      body: {
        karyawanId: 3,
        leaveTypeId: 1,
        startDate: `${YEAR}-01-03`,
        endDate: `${YEAR}-01-04`,
        halfDay: false,
        reason: "Menemani keluarga dari luar kota",
      },
    });

    expect(result?.status).toBe(201);
    expect((result?.body.data as { totalDays: string }).totalDays).toBe("2");
  });

  test("rentang yang SELURUHNYA libur ditolak dengan LEAVE_ZERO_DAYS", async () => {
    const result = await onCall("POST", "/cuti", {
      body: {
        ...RECURRING,
        startDate: "2027-09-27",
        endDate: "2027-09-27",
      },
    });

    expect(result?.status).toBe(400);
    expect(result?.body.code).toBe("LEAVE_ZERO_DAYS");
    expect(String(result?.body.error)).toContain(
      "Tidak Memuat Satu Hari Kerja",
    );
  });

  test("setengah hari tepat di hari libur ditolak, bukan disimpan −0,5", async () => {
    const result = await onCall("POST", "/cuti", {
      body: {
        ...RECURRING,
        startDate: "2027-09-27",
        endDate: "2027-09-27",
        halfDay: true,
      },
    });

    expect(result?.status).toBe(400);
    expect(result?.body.code).toBe("LEAVE_ZERO_DAYS");
    expect(LEAVE_REQUEST.some((row) => Number(row.totalDays) <= 0)).toBe(false);
  });

  test("ubah memakai aturan yang sama dengan tambah", async () => {
    // Karyawan 2 libur Senin+Selasa — bukan akhir pekan: 25 Sab kerja,
    // 26 Min kerja, 27 Sen libur mingguan DAN HUT, 28 Sel libur mingguan,
    // 29 Rab kerja → tiga hari. Libur mingguan tiap orang memang berbeda, dan
    // di situlah aturannya berhenti bisa ditebak dari kalender saja.
    const result = await onCall("PUT", `/cuti/CTI-${YEAR}-0006`, {
      body: {
        karyawanId: 2,
        leaveTypeId: 2,
        startDate: "2027-09-25",
        endDate: "2027-09-29",
        halfDay: false,
        reason: "Rangkaian HUT gereja",
      },
    });

    expect(result?.status).toBe(200);
    expect((result?.body.data as { totalDays: string }).totalDays).toBe("3");
  });
});

describe("simpan", () => {
  test("totalDays dihitung server dan payload yang mengirimnya diabaikan", async () => {
    const result = await onCall("POST", "/cuti", {
      body: { ...VALID, totalDays: "99" },
    });
    const data = result?.body.data as { totalDays: string };

    expect(result?.status).toBe(201);
    expect(data.totalDays).toBe("2");
  });

  test("setengah hari pada satu hari jadi 0.5; pada rentang ditolak", async () => {
    const half = await onCall("POST", "/cuti", {
      body: { ...VALID, endDate: VALID.startDate, halfDay: true },
    });
    expect((half?.body.data as { totalDays: string }).totalDays).toBe("0.5");

    const wide = await onCall("POST", "/cuti", {
      body: { ...VALID, halfDay: true },
    });
    expect(wide?.status).toBe(400);
    expect(wide?.body.issues).toEqual([
      {
        path: "halfDay",
        message: "Setengah Hari hanya berlaku untuk cuti satu hari",
      },
    ]);
  });

  test("tanggal selesai sebelum mulai ditolak di field endDate", async () => {
    const result = await onCall("POST", "/cuti", {
      body: { ...VALID, endDate: addDays(VALID.startDate, -2) },
    });

    expect(result?.status).toBe(400);
    expect(result?.body.issues).toEqual([
      {
        path: "endDate",
        message: "Tanggal Selesai tidak boleh sebelum Tanggal Mulai",
      },
    ]);
  });

  test("alasan 250 lolos, 251 ditolak", async () => {
    expect(
      (
        await onCall("POST", "/cuti", {
          body: { ...VALID, reason: "a".repeat(250) },
        })
      )?.status,
    ).toBe(201);
    expect(
      (
        await onCall("POST", "/cuti", {
          body: {
            ...VALID,
            startDate: "2027-04-14",
            endDate: "2027-04-14",
            reason: "a".repeat(251),
          },
        })
      )?.status,
    ).toBe(400);
  });

  test("tumpang-tindih menjawab 409 dengan pesan be-sada", async () => {
    const taken = SEED.find((row) => row.status === "PENDING");
    const result = await onCall("POST", "/cuti", {
      body: {
        ...VALID,
        karyawanId: taken?.karyawanId,
        startDate: taken?.startDate,
        endDate: taken?.endDate,
      },
    });

    expect(result?.status).toBe(409);
    expect(String(result?.body.error)).toContain(
      "sudah memiliki pengajuan cuti",
    );
  });

  test("lahir PENDING, bukan DRAFT, dan tanpa persetujuan", async () => {
    const data = (await onCall("POST", "/cuti", { body: VALID }))?.body
      .data as {
      status: string;
      approval: unknown;
      code: string;
    };

    expect(data.status).toBe("PENDING");
    expect(data.approval).toBeNull();
    expect(data.code).toMatch(new RegExp(`^CTI-${YEAR}-\\d{4}$`));
  });

  test("ubah menolak baris yang sudah diproses dan yang sedang ditandatangani", async () => {
    const processed = await onCall("PUT", `/cuti/CTI-${YEAR}-0001`, {
      body: VALID,
    });
    expect(processed?.status).toBe(400);
    expect(processed?.body.error).toBe("Pengajuan Cuti Ini Sudah Diproses");

    const waiting = await onCall("PUT", `/cuti/CTI-${YEAR}-0005`, {
      body: VALID,
    });
    expect(waiting?.status).toBe(400);
    expect(String(waiting?.body.error)).toContain("Tarik Pengajuannya");
  });

  test("ubah tidak membelanjakan harinya dua kali", async () => {
    const result = await onCall("PUT", `/cuti/CTI-${YEAR}-0006`, {
      body: {
        karyawanId: 2,
        leaveTypeId: 5,
        startDate: "2027-04-14",
        endDate: "2027-04-15",
        halfDay: false,
        reason: "Pemakaman paman, menginap satu malam",
      },
    });

    expect(result?.status).toBe(200);
    expect((result?.body.data as { totalDays: string }).totalDays).toBe("2");
  });
});

describe("aksi", () => {
  test("pengajuan memasang persetujuan PENDING; baris cuti tetap PENDING", async () => {
    const result = await onCall("POST", `/cuti/CTI-${YEAR}-0006/pengajuan`);
    const row = LEAVE_REQUEST.find((item) => item.code === `CTI-${YEAR}-0006`);

    expect(result?.status).toBe(201);
    expect(row?.status).toBe("PENDING");
    expect(row?.approval?.status).toBe("PENDING");
  });

  test("batal ditolak untuk cuti yang mulai hari ini atau sudah lewat", async () => {
    const row = LEAVE_REQUEST.find((item) => item.code === `CTI-${YEAR}-0006`);
    if (row) {
      row.status = "APPROVED";
      row.startDate = TODAY;
      row.endDate = TODAY;
    }

    const result = await onCall("PUT", `/cuti/CTI-${YEAR}-0006/batal`);
    expect(result?.status).toBe(400);
    expect(String(result?.body.error)).toContain("Pembatalan Hanya Sebelum");
  });

  test("batal hanya untuk yang sudah disetujui", async () => {
    const result = await onCall("PUT", `/cuti/CTI-${YEAR}-0006/batal`);

    expect(result?.status).toBe(400);
    expect(String(result?.body.error)).toContain("Sudah Disetujui");
  });

  test("hapus menyembunyikan barisnya dari daftar dan detail", async () => {
    expect((await onCall("DELETE", `/cuti/CTI-${YEAR}-0006`))?.status).toBe(
      200,
    );
    expect((await onCall("GET", `/cuti/CTI-${YEAR}-0006`))?.status).toBe(404);
  });
});

describe("flag", () => {
  test("MOCK_500 hanya menyentuh daftar", async () => {
    process.env.MOCK_500 = "1";

    expect((await onCall("GET", "/cuti"))?.status).toBe(500);
    expect((await onCall("GET", `/cuti/CTI-${YEAR}-0001`))?.status).toBe(200);
  });

  test("MOCK_CUTI_SAVE_ERROR hanya menyentuh jalur tulis", async () => {
    process.env.MOCK_CUTI_SAVE_ERROR = "500";

    expect((await onCall("POST", "/cuti", { body: VALID }))?.status).toBe(500);
    expect((await onCall("GET", `/cuti/CTI-${YEAR}-0001`))?.status).toBe(200);
  });

  test("MOCK_CUTI_OVERLAP memaksa 409 di rentang mana pun", async () => {
    process.env.MOCK_CUTI_OVERLAP = "1";

    expect((await onCall("POST", "/cuti", { body: VALID }))?.status).toBe(409);
  });
});

describe("jalur lain", () => {
  test("path di luar /cuti dilewatkan", async () => {
    expect(await onCall("GET", "/tipe-cuti")).toBeNull();
  });

  test("kode yang tidak ada menjawab 404", async () => {
    expect((await onCall("GET", `/cuti/CTI-${YEAR}-9999`))?.status).toBe(404);
  });
});
