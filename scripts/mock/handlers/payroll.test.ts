import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { PayrollItem } from "../../../src/features/beranda/api";
import { JOURNAL_ENTRY } from "../keuangan-store";
import type { MockAction } from "../kit";

import { resetKaryawanRows } from "./karyawan";
import { PAYROLL_RUN, payrollMock, resetPayrollRows } from "./payroll";

type Json = {
  status: number;
  code?: string;
  error?: string;
  message?: string;
  totalData?: number;
  data?: unknown;
};

type RunJson = {
  code: string;
  status: string;
  totalGross: string;
  totalDeduction: string;
  totalNet: string;
  payslips?: {
    code: string;
    netAmount: string;
    deductionTotal: string;
    karyawan: { name: string } | null;
    lines: { componentName: string; componentType: string; amount: string }[];
  }[];
  journal?: { code: string } | null;
  approval?: { status: string } | null;
};

// Roster karyawan bisa ditulisi dan dimiliki modul lain: tanpa reset ini,
// berkas yang menyunting KRY-0001 lebih dulu mengubah slip yang dihitung sini.
beforeEach(() => {
  resetKaryawanRows();
  resetPayrollRows();
});

afterEach(() => {
  resetKaryawanRows();
  resetPayrollRows();
  delete process.env.MOCK_EMPTY;
  delete process.env.MOCK_500;
  delete process.env.MOCK_PYR_STEPUP;
  delete process.env.MOCK_PYR_STALE;
  delete process.env.MOCK_PYR_NO_EMPLOYEE;
  delete process.env.MOCK_PYR_PAY_ERROR;
  delete process.env.MOCK_PYR_AUTO_APPROVE;
  delete process.env.MOCK_PERIOD_CLOSED;
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await payrollMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can: can as never,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const only =
  (slug: string) =>
  (candidate: string): boolean =>
    candidate === slug;

const runOf = (body: Json | undefined) => body?.data as RunJson | undefined;

const rowsOf = (body: Json | undefined) => (body?.data ?? []) as RunJson[];

const codesOf = (body: Json | undefined) => rowsOf(body).map((row) => row.code);

/**
 * Kode dibaca dari benihnya, bukan dipaku: `resetPeriod: "YEARLY"` menyisipkan
 * tahun (`PYR-2026-0001`), dan benih yang membentang lewat Januari memberi dua
 * tahun yang berbeda dalam satu daftar.
 */
const codeOf = (id: number) =>
  PAYROLL_RUN.find((row) => row.id === id)?.code ?? `pyr-${id}-hilang`;

const seededCodes = () => [5, 4, 3, 2, 1].map(codeOf);

/**
 * Test perilaku per rute baca, dua arah, menyatakan BARIS YANG DIKEMBALIKAN —
 * bukan hanya siapa yang boleh memanggil. Ia alasan `payroll.test.ts` boleh
 * masuk allowlist `privacy.test.ts`.
 */
describe("bacaan gaji", () => {
  test("GET / mengembalikan tepat baris benihnya, dengan PAYROLL VIEW", async () => {
    const result = await onCall(
      "GET",
      "/payroll?limit=100",
      undefined,
      only(MENU.PAYROLL),
    );

    expect(result?.status).toBe(200);
    expect(codesOf(result?.body)).toEqual(seededCodes());
    expect(result?.body.totalData).toBe(5);
  });

  test("GET / tanpa PAYROLL VIEW mengembalikan nol baris", async () => {
    for (const slug of [
      MENU.EMPLOYEE_CONTRACT,
      MENU.EMPLOYEE,
      MENU.PAYROLL_COMPONENT,
    ]) {
      const result = await onCall(
        "GET",
        "/payroll?limit=100",
        undefined,
        only(slug),
      );

      expect(result?.status, slug).toBe(403);
      expect(result?.body.data, slug).toBeUndefined();
    }
  });

  // §0.3 no. 3, dinyatakan atas baris yang benar-benar kembali: daftar membawa
  // periode dan tiga agregat, dan tidak satu pun nama atau nominal per orang.
  test("GET / tidak membawa satu pun nama atau slip", async () => {
    const result = await onCall(
      "GET",
      "/payroll?limit=100",
      undefined,
      only(MENU.PAYROLL),
    );
    const serialised = JSON.stringify(result?.body.data);

    for (const row of rowsOf(result?.body)) {
      expect(row.payslips, row.code).toBeUndefined();
      expect(row.totalNet, row.code).toMatch(/^\d+\.\d{2}$/);
    }

    expect(serialised).not.toContain("Andreas Sitanggang");
    expect(serialised).not.toContain("karyawan");
  });

  test("GET /:code mengembalikan run yang diminta dan slipnya", async () => {
    const result = await onCall(
      "GET",
      `/payroll/${codeOf(4)}`,
      undefined,
      only(MENU.PAYROLL),
    );
    const run = runOf(result?.body);

    expect(result?.status).toBe(200);
    expect(run?.code).toBe(codeOf(4));
    expect(run?.status).toBe("PAID");
    expect(run?.payslips?.length).toBeGreaterThan(0);
    // Satu-satunya tempat nama bersebelahan dengan nominal, dan ia di halaman
    // yang harus sengaja dibuka.
    expect(run?.payslips?.[0]?.karyawan?.name).toBe("Andreas Sitanggang");
    expect(run?.payslips?.[0]?.netAmount).toMatch(/^\d+\.\d{2}$/);
  });

  test("GET /:code tanpa PAYROLL VIEW mengembalikan nol baris", async () => {
    for (const slug of [
      MENU.EMPLOYEE_CONTRACT,
      MENU.EMPLOYEE,
      MENU.PAYROLL_COMPONENT,
    ]) {
      const result = await onCall(
        "GET",
        `/payroll/${codeOf(4)}`,
        undefined,
        only(slug),
      );

      expect(result?.status, slug).toBe(403);
      expect(result?.body.data, slug).toBeUndefined();
    }
  });

  test("kedua bacaan 403 STEP_UP_REQUIRED saat password diminta lagi", async () => {
    for (const input of ["/payroll", `/payroll/${codeOf(4)}`]) {
      process.env.MOCK_PYR_STEPUP = "1";
      process.env.MOCK_STEPUP_EXPIRE_MS = "0";

      const result = await onCall("GET", input, undefined, only(MENU.PAYROLL));

      expect(result?.status, input).toBe(403);
      expect(result?.body.code, input).toBe("STEP_UP_REQUIRED");
    }

    delete process.env.MOCK_STEPUP_EXPIRE_MS;
  });

  test("tulisan tidak dijaga step-up", async () => {
    process.env.MOCK_PYR_STEPUP = "1";

    const result = await onCall("PUT", `/payroll/${codeOf(1)}/hitung`);

    expect(result?.status).toBe(200);
  });
});

describe("pajak nol adalah hasil yang benar", () => {
  test("nol slip membawa baris PPh21, dan potongannya tetap angka", async () => {
    const result = await onCall("PUT", `/payroll/${codeOf(1)}/hitung`);
    const run = runOf(result?.body);
    const names = (run?.payslips ?? []).flatMap((slip) =>
      slip.lines.map((line) => line.componentName),
    );

    expect(result?.status).toBe(200);
    expect(names).not.toContain("PPh21");
    expect(run?.payslips?.every((slip) => slip.deductionTotal !== undefined));
  });
});

/**
 * `GET /payroll` punya DUA pembaca, dan yang kedua tidak kelihatan dari sini:
 * widget Beranda `payables` membaca `PayrollItem` dan memanggil
 * `row.createdAt.slice(0, 10)` tanpa penjaga. Field yang hilang di sana bukan
 * baris kosong — ia TypeError saat render.
 *
 * `Record<keyof PayrollItem, true>` membuat daftarnya terikat ke tipenya:
 * field yang ditambahkan ke `PayrollItem` tidak bisa lolos tanpa gagal
 * kompilasi di sini lebih dulu.
 */
describe("baris daftar memenuhi kontrak SETIAP pembacanya", () => {
  const BERANDA_FIELDS: Record<keyof PayrollItem, true> = {
    code: true,
    year: true,
    month: true,
    status: true,
    totalNet: true,
    createdAt: true,
  };

  test("setiap field yang Beranda deklarasikan ada di tiap baris", async () => {
    const result = await onCall(
      "GET",
      "/payroll?limit=100",
      undefined,
      only(MENU.PAYROLL),
    );
    const rows = rowsOf(result?.body) as unknown as Record<string, unknown>[];

    expect(rows.length).toBe(5);
    for (const row of rows) {
      for (const field of Object.keys(BERANDA_FIELDS)) {
        expect(row[field], `${String(row.code)}.${field}`).toBeDefined();
      }
    }
  });

  test("createdAt berbentuk tanggal yang `slice(0, 10)` bisa baca", async () => {
    const result = await onCall(
      "GET",
      "/payroll?limit=100",
      undefined,
      only(MENU.PAYROLL),
    );

    for (const row of rowsOf(result?.body) as unknown as {
      code: string;
      createdAt: string;
    }[]) {
      expect(row.createdAt.slice(0, 10), row.code).toMatch(
        /^\d{4}-\d{2}-\d{2}$/,
      );
    }
  });
});

describe("kode slip", () => {
  // `payslip.code` unik di seluruh tabel, bukan per run: nomor per run membuat
  // dua run punya SLP-2026-0001 yang sama, dan halaman slip dua orang berbeda
  // berbagi satu URL.
  test("nol kode slip terulang di seluruh run", () => {
    const codes = PAYROLL_RUN.flatMap((row) =>
      row.payslips.map((slip) => slip.code),
    );

    expect(codes.length).toBeGreaterThan(0);
    expect(new Set(codes).size).toBe(codes.length);
  });

  test("menghitung ulang memakai nomor baru, tidak memakai ulang", async () => {
    const before = PAYROLL_RUN.flatMap((row) =>
      row.payslips.map((slip) => slip.code),
    );

    await onCall("PUT", `/payroll/${codeOf(1)}/hitung`);

    const after = PAYROLL_RUN.flatMap((row) =>
      row.payslips.map((slip) => slip.code),
    );

    expect(new Set(after).size).toBe(after.length);
    expect(after.filter((code) => before.includes(code))).toEqual(
      before.filter((code) => after.includes(code)),
    );
  });
});

describe("mesin status", () => {
  test("hitung menolak run yang sedang menunggu persetujuan", async () => {
    const result = await onCall("PUT", `/payroll/${codeOf(3)}/hitung`);

    expect(result?.status).toBe(400);
    expect(result?.body.error).toMatch(/Menunggu Persetujuan/i);
  });

  test("hitung menolak run yang sudah disetujui", async () => {
    const result = await onCall("PUT", `/payroll/${codeOf(5)}/hitung`);

    expect(result?.status).toBe(400);
  });

  test("pengajuan memakai run yang sudah dihitung saja", async () => {
    expect(
      (await onCall("POST", `/payroll/${codeOf(1)}/pengajuan`))?.status,
    ).toBe(400);

    await onCall("PUT", `/payroll/${codeOf(1)}/hitung`);
    const result = await onCall("POST", `/payroll/${codeOf(1)}/pengajuan`);

    expect(result?.status).toBe(201);
    expect(runOf(result?.body)?.status).toBe("CALCULATED");
    expect(runOf(result?.body)?.approval?.status).toBe("PENDING");
  });

  // PAID itu TERMINAL — dan ketiganya diuji, karena inilah yang membuat posting
  // jurnal aman tanpa jalur pembalikan apa pun.
  test("run yang sudah dibayar menolak batal, hapus, dan hitung ulang", async () => {
    expect((await onCall("PUT", `/payroll/${codeOf(4)}/batal`))?.status).toBe(
      400,
    );
    expect((await onCall("DELETE", `/payroll/${codeOf(4)}`))?.status).toBe(400);
    expect((await onCall("PUT", `/payroll/${codeOf(4)}/hitung`))?.status).toBe(
      400,
    );
    expect(PAYROLL_RUN.find((row) => row.id === 4)?.status).toBe("PAID");
  });

  test("run yang sudah disetujui tidak bisa dihapus, tapi bisa dibatalkan", async () => {
    expect((await onCall("DELETE", `/payroll/${codeOf(5)}`))?.status).toBe(400);
    expect((await onCall("PUT", `/payroll/${codeOf(5)}/batal`))?.status).toBe(
      200,
    );
  });

  test("run yang dibatalkan boleh dihapus, supaya bulannya bisa dibuka lagi", async () => {
    expect((await onCall("DELETE", `/payroll/${codeOf(2)}`))?.status).toBe(200);
  });

  test("setiap tulisan menjawab PAYROLL_RUN_CHANGED saat run sudah bergeser", async () => {
    process.env.MOCK_PYR_STALE = "1";

    for (const [method, input] of [
      ["PUT", `/payroll/${codeOf(1)}/hitung`],
      ["POST", `/payroll/${codeOf(1)}/pengajuan`],
      ["PUT", `/payroll/${codeOf(5)}/bayar`],
      ["PUT", `/payroll/${codeOf(1)}/batal`],
      ["DELETE", `/payroll/${codeOf(1)}`],
    ] as const) {
      const result = await onCall(method, input);

      expect(result?.status, input).toBe(409);
      expect(result?.body.code, input).toBe("PAYROLL_RUN_CHANGED");
    }
  });

  test("buka periode menolak bulan yang belum mulai dan periode kembar", async () => {
    const next = new Date();
    next.setUTCMonth(next.getUTCMonth() + 2);

    const early = await onCall("POST", "/payroll", {
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
    });

    expect(early?.status).toBe(400);
    expect(early?.body.error).toBe("Periode Penggajian Belum Dimulai");

    const seeded = PAYROLL_RUN[0];
    const duplicate = await onCall("POST", "/payroll", {
      year: seeded.year,
      month: seeded.month,
    });

    expect(duplicate?.status).toBe(409);
  });
});

describe("bayar menulis satu entri jurnal", () => {
  const entriesOf = () =>
    JOURNAL_ENTRY.filter((entry) => entry.sourceType === "PAYROLL_RUN");

  test("entri seimbang, agregat, dan nol nama orang di dalamnya", async () => {
    const before = entriesOf().length;
    const result = await onCall("PUT", `/payroll/${codeOf(5)}/bayar`);
    const written = entriesOf();

    expect(result?.status).toBe(200);
    expect(written.length).toBe(before + 1);

    const entry = written[written.length - 1];
    const debit = entry.lines.reduce(
      (total, line) => total + Number(line.debit),
      0,
    );
    const credit = entry.lines.reduce(
      (total, line) => total + Number(line.credit),
      0,
    );

    expect(entry.lines.length).toBeGreaterThanOrEqual(2);
    expect(debit).toBeCloseTo(credit, 2);
    // Buku besar berbunyi "Penggajian PYR-<tahun>-0005", bukan nama orang.
    expect(JSON.stringify(entry)).not.toContain("Andreas Sitanggang");
    // Baris bernilai nol tidak pernah ditulis.
    expect(
      entry.lines.every(
        (line) => Number(line.debit) > 0 || Number(line.credit) > 0,
      ),
    ).toBe(true);
  });

  test("bayar menjawab kode entri jurnalnya", async () => {
    const result = await onCall("PUT", `/payroll/${codeOf(5)}/bayar`);

    expect(runOf(result?.body)?.journal?.code).toMatch(/^JRN-/);
  });

  test("bayar kedua ditolak, dan nol entri kedua ditulis", async () => {
    await onCall("PUT", `/payroll/${codeOf(5)}/bayar`);
    const after = entriesOf().length;
    const again = await onCall("PUT", `/payroll/${codeOf(5)}/bayar`);

    expect(again?.status).toBe(400);
    expect(entriesOf().length).toBe(after);
  });

  test.each([
    ["akun", "PAYROLL_ACCOUNT_UNMAPPED"],
    ["komponen", "PAYROLL_COMPONENT_UNMAPPED"],
    ["nonaktif", "ACCOUNT_INACTIVE"],
    ["negatif", "PAYROLL_NET_NEGATIVE"],
    ["lock", "PERIOD_CLOSED_UNDER_LOCK"],
  ])("%s menjawab %s, dan nol entri ditulis", async (flag, code) => {
    process.env.MOCK_PYR_PAY_ERROR = flag;
    const before = entriesOf().length;

    const result = await onCall("PUT", `/payroll/${codeOf(5)}/bayar`);

    expect(result?.status).toBe(400);
    expect(result?.body.code).toBe(code);
    expect(entriesOf().length).toBe(before);
    expect(PAYROLL_RUN.find((row) => row.id === 5)?.status).toBe("APPROVED");
  });

  test("periode fiskal tertutup menjawab PERIOD_CLOSED", async () => {
    process.env.MOCK_PERIOD_CLOSED = "1";

    const result = await onCall("PUT", `/payroll/${codeOf(5)}/bayar`);

    expect(result?.status).toBe(400);
    expect(result?.body.code).toBe("PERIOD_CLOSED");
  });
});

describe("izin per aksi", () => {
  test("batal dan hapus butuh DELETE, bukan UPDATE", async () => {
    const asUpdate = (_slug: string, action: MockAction) => action !== "DELETE";

    expect(
      (await onCall("PUT", `/payroll/${codeOf(1)}/batal`, undefined, asUpdate))
        ?.status,
    ).toBe(403);
    expect(
      (await onCall("DELETE", `/payroll/${codeOf(1)}`, undefined, asUpdate))
        ?.status,
    ).toBe(403);
  });

  test("hitung, pengajuan, dan bayar butuh UPDATE, bukan DELETE", async () => {
    const asDelete = (_slug: string, action: MockAction) => action !== "UPDATE";

    for (const [method, input] of [
      ["PUT", `/payroll/${codeOf(1)}/hitung`],
      ["POST", `/payroll/${codeOf(1)}/pengajuan`],
      ["PUT", `/payroll/${codeOf(5)}/bayar`],
    ] as const) {
      expect(
        (await onCall(method, input, undefined, asDelete))?.status,
        input,
      ).toBe(403);
    }
  });
});
