/**
 * Tiruan `/api/v1/payroll` (be-sada modul `payroll`, `bc20690`). Kunci path
 * `code`, cocok tanpa peduli huruf besar-kecil.
 *
 * Kodenya `PYR-2026-0001`, BUKAN `PYR-0001` seperti brief menuliskannya:
 * `generateCode("PYR", { resetPeriod: "YEARLY" })` menyisipkan tahun
 * (`generateCode.ts:166-168`), karena penghitung yang restart harus membawa
 * periode restartnya. Sama untuk `SLP-`.
 *
 *   MOCK_500=1                  → daftar menjawab 500
 *   MOCK_EMPTY=1                → daftar kosong (404, lewat `list`)
 *   MOCK_FAIL_PAGE=3            → halaman 3 daftar menjawab 500
 *   MOCK_PYR_STEPUP=1           → bacaan pertama 403 STEP_UP_REQUIRED, lalu
 *                                 terbuka selama MOCK_STEPUP_EXPIRE_MS
 *   MOCK_PYR_STALE=1            → setiap tulisan 409 PAYROLL_RUN_CHANGED
 *   MOCK_PYR_NO_EMPLOYEE=1      → hitung 400 "tidak ada karyawan berkontrak"
 *   MOCK_PYR_PAY_ERROR=akun     → bayar 400 PAYROLL_ACCOUNT_UNMAPPED
 *                        =komponen → 400 PAYROLL_COMPONENT_UNMAPPED
 *                        =nonaktif → 400 ACCOUNT_INACTIVE
 *                        =negatif  → 400 PAYROLL_NET_NEGATIVE
 *                        =lock     → 400 PERIOD_CLOSED_UNDER_LOCK
 *   MOCK_PERIOD_CLOSED=1        → bayar 400 PERIOD_CLOSED (dipegang
 *                                 `postDocumentEntry` di keuangan-store)
 *   MOCK_PYR_AUTO_APPROVE=1     → pengajuan langsung APPROVED, supaya jalur
 *                                 bayar bisa ditelusuri tanpa menandatangani
 *
 * Dua hal MENDAHULUI be-sada dan disengaja, keduanya di jalur baca detail:
 * `approval` dan `journal`. `findByCode` hanya meng-`include` `payslips`
 * (`payroll.repository.ts:60-67`), jadi di produksi hari ini keduanya tidak
 * dikirim — layar turun ke status polos dan tidak mengklaim apa pun tentang
 * jurnal. SG-FE1 dan SG-FE2.
 *
 * Benih karyawan, kontrak, dan komponen dimiliki modul yang menyemainya
 * (pedoman §7.2); berkas ini hanya membacanya, persis seperti `calculate`
 * membaca tabelnya.
 *
 * NOL rute ekspor, cetak, atau unduh di sini, dan itu aturan (SDM §0.3 no. 1).
 */
import { MENU } from "../../../src/config/menu";
import { addMonths, startOfMonth, todayJakarta } from "../../../src/lib/date";
import {
  JOURNAL_ENTRY,
  journalRefOfSource,
  postDocumentEntry,
  type DocumentLine,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

import { KARYAWAN } from "./karyawan";
import {
  KARYAWAN_PAYROLL_COMPONENT,
  PAYROLL_COMPONENT,
} from "./komponen-payroll";
import { KARYAWAN_CONTRACT } from "./kontrak-karyawan";

const BASE = "/payroll";

const SOURCE_TYPE = "PAYROLL_RUN";

/**
 * Setelan `GAJI_BEBAN` dan `GAJI_KAS` belum ada di `ACCOUNTING_SETTING_KEYS`
 * fe-sada maupun di benih `keuangan-store`, sementara be-sada `bc20690` sudah
 * punya keduanya. Dua akun ini berdiri di tempatnya supaya jalur bayar bisa
 * ditelusuri; `MOCK_PYR_PAY_ERROR=akun` meniru keadaan sebelum P3 dikerjakan.
 */
const EXPENSE_ACCOUNT_ID = 23;

const CASH_ACCOUNT_ID = 2;

type PayrollStatus = "DRAFT" | "CALCULATED" | "APPROVED" | "PAID" | "CANCELLED";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type LineRow = {
  publicId: string;
  payrollComponentId: number;
  componentName: string;
  componentType: "EARNING" | "DEDUCTION";
  amount: string;
};

type SlipRow = {
  id: number;
  publicId: string;
  code: string;
  karyawanId: number;
  basicSalary: string;
  grossAmount: string;
  deductionTotal: string;
  netAmount: string;
  note: string | null;
  lines: LineRow[];
};

type ApprovalRow = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  steps: {
    order: number;
    approverRoleName: string;
    status: ApprovalStatus;
    actor: { name: string } | null;
    actedAt: string | null;
  }[];
};

type RunRow = {
  id: number;
  publicId: string;
  code: string;
  year: number;
  month: number;
  status: PayrollStatus;
  totalGross: string;
  totalDeduction: string;
  totalNet: string;
  approvedAt: string | null;
  paidAt: string | null;
  payslips: SlipRow[];
  approval: ApprovalRow | null;
};

const TODAY = todayJakarta();

// `generateCode` menyisipkan tahun dari JAM, bukan dari periode dokumennya:
// penggajian Desember yang dihitung di Januari tetap bernomor tahun baru.
const CODE_YEAR = TODAY.slice(0, 4);

const monthsBack = (back: number) => {
  const month = addMonths(startOfMonth(TODAY), -back);

  return { year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) };
};

const pad = (value: number, width = 4) => String(value).padStart(width, "0");

/** Hari terakhir bulan, sama dengan `lastDayOf` be-sada. */
const lastDayOf = (year: number, month: number) =>
  `${year}-${pad(month, 2)}-${pad(new Date(Date.UTC(year, month, 0)).getUTCDate(), 2)}`;

const round2 = (value: number) => value.toFixed(2);

const isLive = (row: { deletedAt: string | null }) => row.deletedAt === null;

const contractOn = (karyawanId: number, onDate: string) =>
  KARYAWAN_CONTRACT.find(
    (row) =>
      isLive(row) &&
      row.karyawanId === karyawanId &&
      row.effectiveFrom <= onDate &&
      (row.effectiveTo === null || row.effectiveTo >= onDate),
  ) ?? null;

/**
 * Nilai penetapan menang atas default komponennya, dan baris yang membulat ke
 * 0,00 dibuang sebelum ditulis — `payslip_line_amount_positive` menuntut
 * `> 0`, jadi satu baris nol membatalkan seluruh perhitungan.
 */
const linesFor = (karyawanId: number, basicSalary: number, onDate: string) =>
  KARYAWAN_PAYROLL_COMPONENT.filter(
    (row) =>
      isLive(row) &&
      row.karyawanId === karyawanId &&
      row.effectiveFrom <= onDate &&
      (row.effectiveTo === null || row.effectiveTo >= onDate),
  )
    .map((row) => {
      const component = PAYROLL_COMPONENT.find(
        (item) => item.id === row.payrollComponentId,
      );
      if (!component || !isLive(component) || !component.isActive) return null;

      const raw = Number(row.value ?? component.defaultValue ?? "");
      if (!Number.isFinite(raw)) return null;

      const amount =
        component.calculationType === "PERCENTAGE"
          ? Math.round(((basicSalary * raw) / 100) * 100) / 100
          : raw;
      if (amount <= 0) return null;

      return {
        publicId: `psl-${karyawanId}-${component.id}`,
        payrollComponentId: component.id,
        componentName: component.name,
        componentType: component.type,
        amount: round2(amount),
      } satisfies LineRow;
    })
    .filter((line): line is LineRow => line !== null);

/**
 * Nol baris PPh21: gereja ini tidak memotong, `ptkpStatus` null untuk semua
 * orang, dan pajak nol adalah hasil yang BENAR — bukan baris "Rp 0".
 */
let slipSequence = 0;

const calculateSlips = (year: number, month: number) => {
  const onDate = lastDayOf(year, month);
  const slips: SlipRow[] = [];
  let slipId = 0;

  for (const person of KARYAWAN) {
    if (person.status !== "ACTIVE") continue;

    const contract = contractOn(person.id, onDate);
    if (!contract) continue;

    const basicSalary = Number(contract.basicSalary);
    const lines = linesFor(person.id, basicSalary, onDate);
    const earning = lines
      .filter((line) => line.componentType === "EARNING")
      .reduce((total, line) => total + Number(line.amount), 0);
    const deduction = lines
      .filter((line) => line.componentType === "DEDUCTION")
      .reduce((total, line) => total + Number(line.amount), 0);
    const gross = basicSalary + earning;

    slipId += 1;
    slipSequence += 1;
    slips.push({
      id: slipId,
      publicId: `slp-${year}-${pad(month, 2)}-${slipId}`,
      // `SLP-` adalah urutan tahunan yang PERMANEN: menghitung ulang memakai
      // nomor baru dan meninggalkan celah, sama seperti `generateCodes`.
      code: `SLP-${CODE_YEAR}-${pad(slipSequence)}`,
      karyawanId: person.id,
      basicSalary: round2(basicSalary),
      grossAmount: round2(gross),
      deductionTotal: round2(deduction),
      netAmount: round2(gross - deduction),
      note: null,
      lines,
    });
  }

  return slips;
};

const totalsOf = (slips: readonly SlipRow[]) => ({
  totalGross: round2(
    slips.reduce((total, slip) => total + Number(slip.grossAmount), 0),
  ),
  totalDeduction: round2(
    slips.reduce((total, slip) => total + Number(slip.deductionTotal), 0),
  ),
  totalNet: round2(
    slips.reduce((total, slip) => total + Number(slip.netAmount), 0),
  ),
});

const approval = (
  id: number,
  status: ApprovalStatus,
  actedAt: string | null = null,
): ApprovalRow => ({
  publicId: `apr-pyr-${id}`,
  code: `APR-${pad(900 + id)}`,
  status,
  steps: [
    {
      order: 1,
      approverRoleName: "Bendahara",
      status: status === "PENDING" ? "APPROVED" : status,
      actor: { name: "Lidya Hutagalung" },
      actedAt,
    },
    {
      order: 2,
      approverRoleName: "Ketua Majelis",
      status: status === "PENDING" ? "PENDING" : status,
      actor: status === "PENDING" ? null : { name: "Pdt. Samuel Panjaitan" },
      actedAt: status === "PENDING" ? null : actedAt,
    },
  ],
});

const run = (
  id: number,
  back: number,
  status: PayrollStatus,
  extra: Partial<RunRow> = {},
): RunRow => {
  const period = monthsBack(back);
  const slips =
    status === "DRAFT" || status === "CANCELLED"
      ? []
      : calculateSlips(period.year, period.month);

  return {
    id,
    publicId: `pyr-${id}`,
    code: `PYR-${CODE_YEAR}-${pad(id)}`,
    year: period.year,
    month: period.month,
    status,
    ...totalsOf(slips),
    approvedAt: null,
    paidAt: null,
    payslips: slips,
    approval: null,
    ...extra,
  };
};

const postingLines = (row: RunRow): DocumentLine[] => {
  const credits = new Map<number, number>();
  const addCredit = (accountId: number, amount: number) =>
    credits.set(accountId, (credits.get(accountId) ?? 0) + amount);

  const debits = new Map<number, number>();
  const addDebit = (accountId: number, amount: number) =>
    debits.set(accountId, (debits.get(accountId) ?? 0) + amount);

  addDebit(
    EXPENSE_ACCOUNT_ID,
    row.payslips.reduce((total, slip) => total + Number(slip.basicSalary), 0),
  );

  for (const slip of row.payslips) {
    for (const line of slip.lines) {
      const accountId =
        PAYROLL_COMPONENT.find((item) => item.id === line.payrollComponentId)
          ?.accountId ?? null;

      if (line.componentType === "EARNING") {
        addDebit(accountId ?? EXPENSE_ACCOUNT_ID, Number(line.amount));
        continue;
      }

      addCredit(accountId ?? CASH_ACCOUNT_ID, Number(line.amount));
    }
  }

  addCredit(CASH_ACCOUNT_ID, Number(row.totalNet));

  // Baris bernilai nol dibuang sebelum diposting: `journal_line_one_side`
  // menuntut tepat satu sisi dan `> 0`.
  return [
    ...[...debits].map(([accountId, amount]) => ({
      accountId,
      debit: round2(amount),
      credit: "0",
    })),
    ...[...credits].map(([accountId, amount]) => ({
      accountId,
      debit: "0",
      credit: round2(amount),
    })),
  ].filter((line) => Number(line.debit) > 0 || Number(line.credit) > 0);
};

/**
 * Lima run supaya kelima chip status terlihat tanpa menyiapkan apa pun, dan
 * dua di antaranya berada di periode fiskal yang MASIH TERBUKA — benih
 * `keuangan-store` menutup setiap bulan sebelum bulan lalu, jadi run yang
 * memposting harus duduk di sana atau jalur bayarnya tidak bisa ditelusuri.
 */
const seedRows = (): RunRow[] => [
  run(1, 4, "DRAFT"),
  run(2, 3, "CANCELLED"),
  // Dihitung dan sedang dikumpulkan tanda tangannya: statusnya tetap
  // CALCULATED, dan "menunggu" hidup hanya di `approval`.
  run(3, 2, "CALCULATED", { approval: approval(3, "PENDING") }),
  run(4, 1, "PAID", {
    approvedAt: `${addMonths(startOfMonth(TODAY), -1)}T02:00:00.000Z`,
    paidAt: `${addMonths(startOfMonth(TODAY), -1)}T04:00:00.000Z`,
    approval: approval(
      4,
      "APPROVED",
      `${addMonths(startOfMonth(TODAY), -1)}T02:00:00.000Z`,
    ),
  }),
  run(5, 0, "APPROVED", {
    approvedAt: `${startOfMonth(TODAY)}T02:00:00.000Z`,
    approval: approval(5, "APPROVED", `${startOfMonth(TODAY)}T02:00:00.000Z`),
  }),
];

const dropPayrollEntries = () => {
  for (let index = JOURNAL_ENTRY.length - 1; index >= 0; index -= 1) {
    if (JOURNAL_ENTRY[index].sourceType === SOURCE_TYPE) {
      JOURNAL_ENTRY.splice(index, 1);
    }
  }
};

/** Run yang sudah PAID sudah memposting; entry-nya ditulis bersama benihnya. */
const seedAll = () => {
  dropPayrollEntries();
  slipSequence = 0;

  const rows = seedRows();

  for (const row of rows) {
    if (row.status !== "PAID") continue;

    postDocumentEntry({
      sourceType: SOURCE_TYPE,
      sourceId: row.id,
      entryDate: lastDayOf(row.year, row.month),
      description: `Penggajian ${row.code}`,
      lines: postingLines(row),
    });
  }

  return rows;
};

export const PAYROLL_RUN: RunRow[] = seedAll();

let stepUpUntil = 0;

/** Benih dimiliki modul yang menyemainya (pedoman §7.2), bukan berkas test. */
export const resetPayrollRows = () => {
  stepUpUntil = 0;
  PAYROLL_RUN.splice(0, PAYROLL_RUN.length, ...seedAll());
};

const karyawanOf = (id: number) =>
  KARYAWAN.find((person) => person.id === id) ?? null;

const slipView = (slip: SlipRow) => {
  const person = karyawanOf(slip.karyawanId);

  return {
    id: slip.id,
    publicId: slip.publicId,
    code: slip.code,
    karyawanId: slip.karyawanId,
    basicSalary: slip.basicSalary,
    grossAmount: slip.grossAmount,
    deductionTotal: slip.deductionTotal,
    netAmount: slip.netAmount,
    note: slip.note,
    karyawan: person
      ? { publicId: person.publicId, code: person.code, name: person.name }
      : null,
    lines: slip.lines,
  };
};

/** Daftar membawa agregat run saja — NOL slip, NOL nama (SDM §0.3 no. 3). */
const runView = (row: RunRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  year: row.year,
  month: row.month,
  status: row.status,
  totalGross: row.totalGross,
  totalDeduction: row.totalDeduction,
  totalNet: row.totalNet,
  approvedAt: row.approvedAt,
  paidAt: row.paidAt,
});

const detailView = (row: RunRow) => ({
  ...runView(row),
  payslips: row.payslips.map(slipView),
  approval: row.approval,
  journal: journalRefOfSource(SOURCE_TYPE, row.id),
});

const fail = (status: number, error: string, code?: string) =>
  json(code ? { status, error, code } : { status, error }, status);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const stepUpRequired = () =>
  json(
    {
      status: 403,
      error: "Verifikasi Password Diperlukan",
      code: "STEP_UP_REQUIRED",
    },
    403,
  );

const isStepUpBlocked = () => {
  if (!process.env.MOCK_PYR_STEPUP) return false;
  if (Date.now() < stepUpUntil) return false;

  stepUpUntil =
    Date.now() + Number(process.env.MOCK_STEPUP_EXPIRE_MS ?? 300_000);

  return true;
};

/**
 * `PAYROLL_RUN_CHANGED` berarti MUAT ULANG: statusnya sudah pindah di bawah
 * lock, dan tidak ada payload yang bisa dikirim ulang yang akan benar.
 */
const staleRun = (status: PayrollStatus) =>
  fail(
    409,
    `Penggajian Ini Sudah Berstatus ${status} Dan Tidak Dapat Diubah Lagi. Muat Ulang Halaman Terlebih Dahulu`,
    "PAYROLL_RUN_CHANGED",
  );

const PAY_FAILURE: Record<string, { error: string; code: string }> = {
  akun: {
    error: "Akun Beban Gaji Belum Diatur Di Setelan Akuntansi",
    code: "PAYROLL_ACCOUNT_UNMAPPED",
  },
  komponen: {
    error:
      "Komponen Iuran BPJS Kesehatan Belum Punya Akun. Atur Akunnya Di Komponen Payroll Sebelum Penggajian Dibayarkan",
    code: "PAYROLL_COMPONENT_UNMAPPED",
  },
  nonaktif: { error: "Akun 5-110 Sudah Tidak Aktif", code: "ACCOUNT_INACTIVE" },
  negatif: {
    error:
      "Potongan Melebihi Gaji Pada Slip Hanna Simorangkir. Perbaiki Komponennya Sebelum Penggajian Dibayarkan",
    code: "PAYROLL_NET_NEGATIVE",
  },
  lock: {
    error:
      "Periode Fiskal Bulan Ini Baru Saja Ditutup. Penggajian Tidak Dibayarkan",
    code: "PERIOD_CLOSED_UNDER_LOCK",
  },
};

type Body = { year?: unknown; month?: unknown };

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

const PATH = /^\/payroll\/([^/]+)(?:\/(hitung|pengajuan|bayar|batal))?$/;

export const payrollMock: MockHandler = async (context) => {
  const { request, url, path, method, can } = context;

  if (path !== BASE && !path.startsWith(`${BASE}/`)) return null;

  const matched = PATH.exec(path);
  const segment = matched?.[2];
  // `/batal` dan hapus dijaga DELETE; `/hitung`, `/pengajuan`, `/bayar` UPDATE.
  const action =
    segment === "batal" ? "DELETE" : segment ? "UPDATE" : actionOf(method);

  if (!can(MENU.PAYROLL, action)) return denied();

  if (method === "GET" && isStepUpBlocked()) return stepUpRequired();

  if (path === BASE && method === "GET") {
    if (process.env.MOCK_500) return serverError();
    if (
      process.env.MOCK_FAIL_PAGE &&
      url.searchParams.get("page") === process.env.MOCK_FAIL_PAGE
    ) {
      return serverError();
    }

    const year = Number(url.searchParams.get("year")) || 0;
    const status = url.searchParams.get("status") ?? "";

    const rows = PAYROLL_RUN.filter(
      (row) =>
        (!year || row.year === year) && (!status || row.status === status),
    )
      .slice()
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .map(runView);

    return list(rows, url, "Penggajian", "Penggajian");
  }

  if (path === BASE && method === "POST") {
    const body = await readBody<Body>(request);
    const year = Number(body.year);
    const month = Number(body.month);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return fail(400, "Mohon Lengkapi Tahun");
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return fail(400, "Bulan harus antara 1 dan 12");
    }
    if (PAYROLL_RUN.some((row) => row.year === year && row.month === month)) {
      return fail(409, "Penggajian Untuk Periode Ini Sudah Ada");
    }
    // Bulan yang sedang berjalan DITERIMA; yang belum mulai ditolak.
    if (`${year}-${pad(month, 2)}` > TODAY.slice(0, 7)) {
      return fail(400, "Periode Penggajian Belum Dimulai");
    }

    const id = PAYROLL_RUN.reduce((top, row) => Math.max(top, row.id), 0) + 1;
    const row: RunRow = {
      id,
      publicId: `pyr-${id}`,
      code: `PYR-${CODE_YEAR}-${pad(id)}`,
      year,
      month,
      status: "DRAFT",
      totalGross: "0.00",
      totalDeduction: "0.00",
      totalNet: "0.00",
      approvedAt: null,
      paidAt: null,
      payslips: [],
      approval: null,
    };
    PAYROLL_RUN.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuka Penggajian",
        data: runView(row),
      },
      201,
    );
  }

  if (!matched) return null;

  const code = decodeURIComponent(matched[1]);
  const row = PAYROLL_RUN.find(
    (item) => item.code.toLowerCase() === code.toLowerCase(),
  );
  if (!row) return fail(404, "Penggajian Tidak Ditemukan");

  if (!segment && method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Penggajian",
      data: detailView(row),
    });
  }

  if (method !== "GET" && process.env.MOCK_PYR_STALE) {
    return staleRun(row.status);
  }

  const isUnderApproval = row.approval?.status === "PENDING";

  if (segment === "hitung" && method === "PUT") {
    if (row.status !== "DRAFT" && row.status !== "CALCULATED") {
      return fail(400, "Penggajian Ini Sudah Disetujui Atau Dibatalkan");
    }
    if (isUnderApproval) {
      return fail(
        400,
        "Penggajian Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
      );
    }

    const slips = process.env.MOCK_PYR_NO_EMPLOYEE
      ? []
      : calculateSlips(row.year, row.month);

    if (!slips.length) {
      return fail(
        400,
        "Tidak Ada Karyawan Dengan Kontrak Aktif Pada Periode Ini",
      );
    }

    row.payslips = slips;
    Object.assign(row, totalsOf(slips));
    row.status = "CALCULATED";

    return json({
      status: 200,
      message: "Berhasil Menghitung Penggajian",
      data: detailView(row),
    });
  }

  if (segment === "pengajuan" && method === "POST") {
    if (row.status !== "CALCULATED") {
      return fail(400, "Penggajian Ini Belum Dihitung Atau Sudah Diproses");
    }
    if (!row.payslips.length) {
      return fail(
        400,
        "Penggajian Ini Tidak Memiliki Slip Gaji. Hitung Ulang Terlebih Dahulu",
      );
    }
    if (isUnderApproval) return staleRun(row.status);

    const now = new Date().toISOString();

    if (process.env.MOCK_PYR_AUTO_APPROVE) {
      row.approval = approval(row.id, "APPROVED", now);
      row.approvedAt = now;
      row.status = "APPROVED";
    } else {
      row.approval = approval(row.id, "PENDING");
    }

    return json(
      {
        status: 201,
        message: "Berhasil Mengajukan Penggajian Untuk Persetujuan",
        data: detailView(row),
      },
      201,
    );
  }

  if (segment === "bayar" && method === "PUT") {
    if (row.status !== "APPROVED") {
      return fail(400, "Penggajian Ini Belum Disetujui");
    }
    if (!row.payslips.length) {
      return fail(
        400,
        "Penggajian Ini Tidak Memiliki Slip Gaji. Hitung Ulang Terlebih Dahulu",
      );
    }

    const picked = PAY_FAILURE[process.env.MOCK_PYR_PAY_ERROR ?? ""];
    if (picked) return fail(400, picked.error, picked.code);

    const posted = postDocumentEntry({
      sourceType: SOURCE_TYPE,
      sourceId: row.id,
      entryDate: lastDayOf(row.year, row.month),
      description: `Penggajian ${row.code}`,
      lines: postingLines(row),
    });

    if ("failure" in posted) {
      return fail(400, posted.failure.message, posted.failure.code);
    }

    row.status = "PAID";
    row.paidAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menandai Penggajian Sudah Dibayarkan",
      data: { ...detailView(row), journal: { code: posted.entry.code } },
    });
  }

  // PAID itu TERMINAL: nol jalur pembalikan, jadi nol jalan keluar darinya.
  if (segment === "batal" && method === "PUT") {
    if (row.status === "PAID")
      return fail(400, "Penggajian Ini Sudah Dibayarkan");
    if (row.status === "CANCELLED") {
      return fail(400, "Penggajian Ini Sudah Dibatalkan");
    }
    if (isUnderApproval) {
      return fail(
        400,
        "Penggajian Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
      );
    }

    row.status = "CANCELLED";

    return json({
      status: 200,
      message: "Berhasil Membatalkan Penggajian",
      data: detailView(row),
    });
  }

  if (!segment && method === "DELETE") {
    if (row.status === "APPROVED" || row.status === "PAID") {
      return fail(
        400,
        "Penggajian Ini Sudah Disetujui Dan Tidak Dapat Dihapus",
      );
    }
    if (isUnderApproval) {
      return fail(
        400,
        "Penggajian Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
      );
    }

    PAYROLL_RUN.splice(PAYROLL_RUN.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Penggajian",
      data: runView(row),
    });
  }

  return null;
};
