/**
 * Tiruan `/api/v1/cuti` (be-sada `modules/cuti`, `9b94577`).
 *
 *   MOCK_EMPTY=1              → daftar kosong (404) — keadaan hari pertama
 *   MOCK_500=1                → daftar menjawab 500
 *   MOCK_CUTI_SAVE_ERROR=500  → POST/PUT/DELETE dan aksi menjawab 500
 *   MOCK_CUTI_OVERLAP=1       → simpan ditolak 409 tumpang-tindih
 *
 * Benih tipe cuti diimpor dari `tipe-cuti.ts` dan benih karyawan dari
 * `karyawan.ts` (yang melayani `/ddl/karyawan`) — pedoman §7.2: benih
 * dimiliki modul yang menyemainya, bukan berkas yang memakainya.
 *
 * Satu hal yang MENDAHULUI be-sada dan disengaja: `approval` ikut di jalur
 * baca. be-sada `9b94577` belum mengirimnya untuk cuti (SC-FE1), jadi di
 * produksi panel persetujuan dan keadaan "Sedang ditandatangani" belum hidup.
 * Layar turun ke status polos tanpa panel kosong, dan `screen.test.tsx`
 * menyatakan penurunan itu.
 */
import { MENU } from "../../../src/config/menu";
import { addDays, todayJakarta } from "../../../src/lib/date";
import { denied, json, list, readBody, type MockHandler } from "../kit";

import { hariLiburMock } from "./hari-libur";
import { KARYAWAN } from "./karyawan";
import { KARYAWAN_CONTRACT } from "./kontrak-karyawan";
import { LEAVE_TYPE, isLiveLeaveType } from "./tipe-cuti";

const TODAY = todayJakarta();

const YEAR = Number(TODAY.slice(0, 4));

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type StepRow = {
  order: number;
  approverRoleName: string;
  status: ApprovalStatus;
  note: string | null;
  actedAt: string | null;
  actor: { name: string } | null;
};

type ApprovalRow = {
  publicId: string;
  code: string;
  status: ApprovalStatus;
  currentOrder: number;
  steps: StepRow[];
};

export type LeaveRow = {
  id: number;
  publicId: string;
  code: string;
  karyawanId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  totalDays: string;
  reason: string;
  status: LeaveStatus;
  rejectedReason: string | null;
  approvedAt: string | null;
  approval: ApprovalRow | null;
  deletedAt: string | null;
};

const row = (
  id: number,
  karyawanId: number,
  leaveTypeId: number,
  startDate: string,
  endDate: string,
  totalDays: string,
  reason: string,
  status: LeaveStatus,
  approval: ApprovalRow | null = null,
  extra: Partial<Pick<LeaveRow, "rejectedReason" | "approvedAt">> = {},
): LeaveRow => ({
  id,
  publicId: `cti-${String(id).padStart(4, "0")}`,
  code: `CTI-${String(id).padStart(4, "0")}`,
  karyawanId,
  leaveTypeId,
  startDate,
  endDate,
  totalDays,
  reason,
  status,
  rejectedReason: null,
  approvedAt:
    status === "APPROVED" ? `${addDays(startDate, -7)}T03:00:00.000Z` : null,
  approval,
  deletedAt: null,
  ...extra,
});

const signed: ApprovalRow = {
  publicId: "apr-cti-0002",
  code: "APR-0201",
  status: "APPROVED",
  currentOrder: 2,
  steps: [
    {
      order: 1,
      approverRoleName: "Sekretaris Jemaat",
      status: "APPROVED",
      note: null,
      actedAt: `${addDays(TODAY, -20)}T03:10:00.000Z`,
      actor: { name: "Josephine Tanuwijaya" },
    },
    {
      order: 2,
      approverRoleName: "Majelis Jemaat",
      status: "APPROVED",
      note: null,
      actedAt: `${addDays(TODAY, -19)}T02:40:00.000Z`,
      actor: { name: "Pdt. Yohanes Simatupang" },
    },
  ],
};

const REFUSAL =
  "Minggu itu jadwal pelayanan sudah dikunci dan belum ada penggantinya. Ajukan ulang untuk minggu berikutnya setelah penggantinya ditetapkan.";

const refused: ApprovalRow = {
  publicId: "apr-cti-0004",
  code: "APR-0204",
  status: "REJECTED",
  currentOrder: 1,
  steps: [
    {
      order: 1,
      approverRoleName: "Sekretaris Jemaat",
      status: "REJECTED",
      note: REFUSAL,
      actedAt: `${addDays(TODAY, -6)}T04:05:00.000Z`,
      actor: { name: "Josephine Tanuwijaya" },
    },
    {
      order: 2,
      approverRoleName: "Majelis Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
  ],
};

const waiting: ApprovalRow = {
  publicId: "apr-cti-0005",
  code: "APR-0205",
  status: "PENDING",
  currentOrder: 1,
  steps: [
    {
      order: 1,
      approverRoleName: "Sekretaris Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
    {
      order: 2,
      approverRoleName: "Majelis Jemaat",
      status: "PENDING",
      note: null,
      actedAt: null,
      actor: null,
    },
  ],
};

/**
 * Karyawan 1 sengaja melewati jatah Cuti Tahunan (12 hari): 8 + 6 = 14 hari
 * terpakai — dan kedua rentangnya jujur terhadap aturan penuh, Senin libur
 * mingguannya ikut dikurangi. Itu keadaan yang dulu mencetak "Sisa -3 Hari" dan yang
 * `remainingDays` be-sada sekarang lantai-kan di 0.
 */
const SEED: readonly LeaveRow[] = [
  row(
    1,
    1,
    1,
    `${YEAR}-02-02`,
    `${YEAR}-02-11`,
    "8",
    "Pulang kampung menengok orang tua yang baru keluar dari rumah sakit.",
    "APPROVED",
    signed,
  ),
  row(
    2,
    1,
    1,
    `${YEAR}-06-08`,
    `${YEAR}-06-14`,
    "6",
    "Mendampingi anak masuk sekolah di luar kota.",
    "APPROVED",
    signed,
  ),
  row(
    3,
    2,
    2,
    addDays(TODAY, -4),
    addDays(TODAY, -3),
    "2",
    "Demam dan disarankan istirahat oleh dokter.",
    "APPROVED",
    signed,
  ),
  row(
    4,
    3,
    4,
    addDays(TODAY, 21),
    addDays(TODAY, 23),
    "3",
    "Menikah dan mengurus resepsi keluarga.",
    "REJECTED",
    refused,
    { rejectedReason: REFUSAL },
  ),
  row(
    5,
    4,
    3,
    addDays(TODAY, 30),
    addDays(TODAY, 120),
    "66",
    "Cuti melahirkan anak pertama.",
    "PENDING",
    waiting,
  ),
  row(
    6,
    2,
    5,
    addDays(TODAY, 10),
    addDays(TODAY, 10),
    "0.5",
    "Pemakaman paman di Bekasi, berangkat setelah ibadah pagi.",
    "PENDING",
  ),
  row(
    7,
    3,
    1,
    `${YEAR}-01-05`,
    `${YEAR}-01-06`,
    "2",
    "Mengurus pindahan rumah kontrakan.",
    "CANCELLED",
  ),
];

export const LEAVE_REQUEST: LeaveRow[] = SEED.map((item) => ({ ...item }));

/** Pedoman §7.2: benih dimiliki modul yang menyemainya. */
export const resetLeaveRequests = () => {
  LEAVE_REQUEST.length = 0;
  LEAVE_REQUEST.push(...SEED.map((item) => ({ ...item })));
};

export const leaveRequestSeed = () => SEED.map((item) => ({ ...item }));

const isLive = (item: LeaveRow) => item.deletedAt === null;

const nextId = () => Math.max(0, ...LEAVE_REQUEST.map((item) => item.id)) + 1;

const NOT_FOUND = "Pengajuan Cuti Tidak Ditemukan";

const OVERLAP =
  "Karyawan ini sudah memiliki pengajuan cuti pada tanggal yang dipilih. Ubah tanggalnya atau batalkan pengajuan yang lama";

const karyawanOf = (id: number) =>
  KARYAWAN.find((person) => person.id === id) ?? null;

const leaveTypeOf = (id: number) =>
  LEAVE_TYPE.find((item) => isLiveLeaveType(item) && item.id === id) ?? null;

const view = (item: LeaveRow) => {
  const karyawan = karyawanOf(item.karyawanId);
  const leaveType = leaveTypeOf(item.leaveTypeId);

  return {
    id: item.id,
    publicId: item.publicId,
    code: item.code,
    karyawanId: item.karyawanId,
    leaveTypeId: item.leaveTypeId,
    startDate: `${item.startDate}T00:00:00.000Z`,
    endDate: `${item.endDate}T00:00:00.000Z`,
    totalDays: item.totalDays,
    reason: item.reason,
    status: item.status,
    rejectedReason: item.rejectedReason,
    approvedAt: item.approvedAt,
    karyawan: karyawan && {
      publicId: karyawan.publicId,
      code: karyawan.code,
      name: karyawan.name,
      position: karyawan.position,
    },
    leaveType: leaveType && {
      publicId: leaveType.publicId,
      code: leaveType.code,
      name: leaveType.name,
      isPaid: leaveType.isPaid,
      maxDaysPerYear: leaveType.maxDaysPerYear,
    },
    approval: item.approval,
  };
};

const notFound = () => json({ status: 404, error: NOT_FOUND }, 404);

const fieldError = (status: number, path: string, message: string) =>
  json({ status, error: message, issues: [{ path, message }] }, status);

const findRow = (code: string) =>
  LEAVE_REQUEST.find(
    (item) => isLive(item) && item.code.toLowerCase() === code.toLowerCase(),
  );

/** `SPENDING_STATUSES` be-sada: yang menunggu sudah memakai jatah. */
const SPENDING: readonly LeaveStatus[] = ["PENDING", "APPROVED"];

const sumDaysInYear = (
  karyawanId: number,
  leaveTypeId: number,
  year: number,
  exceptId?: number,
) =>
  LEAVE_REQUEST.filter(
    (item) =>
      isLive(item) &&
      item.karyawanId === karyawanId &&
      item.leaveTypeId === leaveTypeId &&
      item.id !== exceptId &&
      SPENDING.includes(item.status) &&
      Number(item.startDate.slice(0, 4)) === year,
  ).reduce((total, item) => total + Number(item.totalDays), 0);

/**
 * Salinan `remainingDays` be-sada (`common/utils/leaveRules.ts`, `f192404`):
 * dilantai di 0, dan `null` TETAP `null`. Jatah boleh diturunkan kapan saja,
 * dan hari yang sudah diambil tidak jadi salah secara surut — tapi tidak ada
 * yang namanya sisa minus tiga hari. `Math.max(0, null)` adalah `0`, dan satu
 * langkah itu mengubah setiap tipe tanpa batas jadi tipe yang habis.
 */
const remainingDays = (maxDaysPerYear: number | null, taken: number) =>
  maxDaysPerYear === null ? null : String(Math.max(maxDaysPerYear - taken, 0));

/** `withinQuota` be-sada: inklusif, dan TIDAK membaca lantai di atas. */
const withinQuota = (
  maxDaysPerYear: number | null,
  taken: number,
  requested: number,
) => maxDaysPerYear === null || taken + requested <= maxDaysPerYear;

const quota = (url: URL) => {
  const karyawanId = Number(url.searchParams.get("karyawanId"));
  const leaveTypeId = Number(url.searchParams.get("leaveTypeId"));

  if (!karyawanId || !leaveTypeId) {
    return json(
      { status: 400, error: "Mohon Lengkapi Karyawan Dan Tipe Cuti" },
      400,
    );
  }

  const karyawan = karyawanOf(karyawanId);
  if (!karyawan) {
    return json({ status: 404, error: "Karyawan Tidak Ditemukan" }, 404);
  }

  const leaveType = leaveTypeOf(leaveTypeId);
  if (!leaveType) {
    return json({ status: 404, error: "Tipe Cuti Tidak Ditemukan" }, 404);
  }

  const year = Number(url.searchParams.get("year")) || YEAR;
  const taken = sumDaysInYear(karyawanId, leaveTypeId, year);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Sisa Jatah Cuti",
    data: {
      karyawan: { name: karyawan.name },
      leaveType: { name: leaveType.name },
      year,
      maxDaysPerYear: leaveType.maxDaysPerYear,
      taken: String(taken),
      remaining: remainingDays(leaveType.maxDaysPerYear, taken),
    },
  });
};

type Body = {
  karyawanId?: unknown;
  leaveTypeId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  halfDay?: unknown;
  reason?: unknown;
  totalDays?: unknown;
};

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const parse = (body: Body) => {
  const karyawanId = Number(body.karyawanId);
  if (!Number.isInteger(karyawanId) || karyawanId < 1) {
    return {
      failure: fieldError(400, "karyawanId", "Mohon Lengkapi Karyawan"),
    };
  }

  const leaveTypeId = Number(body.leaveTypeId);
  if (!Number.isInteger(leaveTypeId) || leaveTypeId < 1) {
    return {
      failure: fieldError(400, "leaveTypeId", "Mohon Lengkapi Tipe Cuti"),
    };
  }

  if (!isIsoDate(body.startDate)) {
    return {
      failure: fieldError(400, "startDate", "Mohon Lengkapi Tanggal Mulai"),
    };
  }

  if (!isIsoDate(body.endDate)) {
    return {
      failure: fieldError(400, "endDate", "Mohon Lengkapi Tanggal Selesai"),
    };
  }

  if (body.endDate < body.startDate) {
    return {
      failure: fieldError(
        400,
        "endDate",
        "Tanggal Selesai tidak boleh sebelum Tanggal Mulai",
      ),
    };
  }

  const halfDay = body.halfDay === true;
  if (halfDay && body.startDate !== body.endDate) {
    return {
      failure: fieldError(
        400,
        "halfDay",
        "Setengah Hari hanya berlaku untuk cuti satu hari",
      ),
    };
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return { failure: fieldError(400, "reason", "Mohon Lengkapi Alasan") };
  }

  if (reason.length > 250) {
    return {
      failure: fieldError(
        400,
        "reason",
        "Alasan tidak boleh lebih dari 250 karakter",
      ),
    };
  }

  return {
    karyawanId,
    leaveTypeId,
    startDate: body.startDate,
    endDate: body.endDate,
    halfDay,
    reason,
  };
};

type Parsed = Exclude<ReturnType<typeof parse>, { failure: Response }>;

/**
 * Hari libur dalam rentang, dari kalender yang `hari-libur.ts` layani —
 * handler-nya dipanggil, bukan rows-nya disalin. Dua sebab: ekspansi
 * `isRecurring` tetap satu tempat (pedoman dan be-sada sama-sama menuntutnya),
 * dan angka yang mock SIMPAN tidak bisa berbeda dari angka yang ringkasan form
 * BACA, karena keduanya sumbernya satu endpoint.
 *
 */
const holidaysBetween = async (from: string, to: string) => {
  const url = new URL(
    `http://mock/api/v1/hari-libur/kalender?from=${from}&to=${to}`,
  );

  const response = await hariLiburMock({
    request: new Request(url),
    url,
    path: "/hari-libur/kalender",
    method: "GET",
    can: () => true,
    isAdmin: false,
    sessionCode: "JMT-0001",
  });

  if (!response || response.status !== 200) return new Set<string>();

  const body = (await response.json()) as { data: { date: string }[] };

  return new Set(body.data.map((item) => item.date));
};

const isOverlapping = (parsed: Parsed, exceptId?: number) =>
  LEAVE_REQUEST.some(
    (item) =>
      isLive(item) &&
      item.id !== exceptId &&
      item.karyawanId === parsed.karyawanId &&
      SPENDING.includes(item.status) &&
      item.startDate <= parsed.endDate &&
      parsed.startDate <= item.endDate,
  );

/**
 * Libur mingguan karyawan dari kontrak yang berlaku di tanggal MULAI, meniru
 * `cutiRepository.findWeeklyDayOff`. Benihnya diimpor dari modul yang
 * menyemainya, tidak diduplikasi (pedoman §7.2).
 *
 * Larik kosong berarti dua hal yang jalur cuti sengaja tidak bedakan: tidak
 * ada kontrak berlaku, dan kontrak yang liburnya belum pernah diisi. Keduanya
 * dibebankan penuh hari kalender — arah yang tidak pernah mengembalikan jatah
 * yang gereja tidak berikan.
 */
const weeklyDayOffOf = (karyawanId: number, onDate: string): number[] => {
  const contract = KARYAWAN_CONTRACT.find(
    (row) =>
      row.deletedAt === null &&
      row.karyawanId === karyawanId &&
      row.effectiveFrom.slice(0, 10) <= onDate &&
      (row.effectiveTo === null || row.effectiveTo.slice(0, 10) >= onDate),
  );

  return contract?.weeklyDayOff ?? [];
};

const assertSavable = async (parsed: Parsed, exceptId?: number) => {
  const karyawan = karyawanOf(parsed.karyawanId);
  if (!karyawan) {
    return json({ status: 404, error: "Karyawan Tidak Ditemukan" }, 404);
  }

  const leaveType = leaveTypeOf(parsed.leaveTypeId);
  if (!leaveType) {
    return json({ status: 404, error: "Tipe Cuti Tidak Ditemukan" }, 404);
  }

  if (!leaveType.isActive) {
    return json({ status: 400, error: "Tipe Cuti Ini Sudah Tidak Aktif" }, 400);
  }

  if (process.env.MOCK_CUTI_OVERLAP || isOverlapping(parsed, exceptId)) {
    return json({ status: 409, error: OVERLAP }, 409);
  }

  const holidays = await holidaysBetween(parsed.startDate, parsed.endDate);
  const weeklyDayOff = weeklyDayOffOf(parsed.karyawanId, parsed.startDate);
  let working = 0;
  for (let at = parsed.startDate; at <= parsed.endDate; at = addDays(at, 1)) {
    if (weeklyDayOff.includes(new Date(`${at}T00:00:00Z`).getUTCDay()))
      continue;
    if (holidays.has(at)) continue;
    working += 1;
  }

  const totalDays = working - (parsed.halfDay ? 0.5 : 0);

  if (totalDays <= 0) {
    return json(
      {
        status: 400,
        code: "LEAVE_ZERO_DAYS",
        error:
          "Rentang Ini Tidak Memuat Satu Hari Kerja Pun. Seluruhnya Libur Mingguan Atau Hari Libur",
      },
      400,
    );
  }

  const year = Number(parsed.startDate.slice(0, 4));
  const taken = sumDaysInYear(
    parsed.karyawanId,
    parsed.leaveTypeId,
    year,
    exceptId,
  );

  if (!withinQuota(leaveType.maxDaysPerYear, taken, totalDays)) {
    return json(
      {
        status: 400,
        error: `Sisa Jatah Cuti Tidak Cukup. ${leaveType.name} Tahun ${year}: Sisa ${remainingDays(leaveType.maxDaysPerYear, taken)} Hari, Diminta ${totalDays} Hari`,
      },
      400,
    );
  }

  return { totalDays };
};

const assertEditable = (item: LeaveRow) => {
  if (item.status !== "PENDING") {
    return json(
      { status: 400, error: "Pengajuan Cuti Ini Sudah Diproses" },
      400,
    );
  }

  if (item.approval?.status === "PENDING") {
    return json(
      {
        status: 400,
        error:
          "Pengajuan Cuti Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
      },
      400,
    );
  }

  return null;
};

/**
 * Guard per rute, bukan per metode: `POST /:code/pengajuan` adalah UPDATE
 * (mengajukan tindakan pengaju) dan `PUT /:code/batal` adalah DELETE
 * (membatalkan cuti yang sudah disetujui) — `cuti.route.ts` be-sada.
 */
const actionOf = (method: string, suffix: string) => {
  if (suffix === "/pengajuan") return "UPDATE";
  if (suffix === "/batal") return "DELETE";

  return method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";
};

const byStartDesc = (a: LeaveRow, b: LeaveRow) =>
  b.startDate.localeCompare(a.startDate) || b.id - a.id;

const STATUSES: readonly LeaveStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
];

const filtered = (url: URL) => {
  const karyawanId = Number(url.searchParams.get("karyawanId"));
  const leaveTypeId = Number(url.searchParams.get("leaveTypeId"));
  const status = url.searchParams.get("status") ?? "";

  return LEAVE_REQUEST.filter(
    (item) =>
      isLive(item) &&
      (!karyawanId || item.karyawanId === karyawanId) &&
      (!leaveTypeId || item.leaveTypeId === leaveTypeId) &&
      (!status || item.status === status),
  ).sort(byStartDesc);
};

export const cutiMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/cuti" && !path.startsWith("/cuti/")) return null;

  if (path === "/cuti/sisa-jatah" && method === "GET") {
    if (!can(MENU.CUTI, "VIEW")) return denied();

    return quota(url);
  }

  const tail = path.slice("/cuti/".length);
  const [code, segment] = tail.split("/");
  const suffix = segment ? `/${segment}` : "";

  if (!can(MENU.CUTI, actionOf(method, suffix))) return denied();

  if (method !== "GET" && process.env.MOCK_CUTI_SAVE_ERROR === "500") {
    return json({ status: 500, error: "Kesalahan server." }, 500);
  }

  if (path === "/cuti" && method === "GET") {
    if (process.env.MOCK_500) {
      return json({ status: 500, error: "Kesalahan server." }, 500);
    }

    const status = url.searchParams.get("status");
    if (status && !STATUSES.includes(status as LeaveStatus)) {
      return json({ status: 400, error: "Status Cuti tidak valid" }, 400);
    }

    return list(
      filtered(url).map(view),
      url,
      "Pengajuan Cuti",
      "Pengajuan Cuti",
      "Berhasil Mendapatkan Pengajuan Cuti",
    );
  }

  if (path === "/cuti" && method === "POST") {
    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const checked = await assertSavable(parsed);
    if (checked instanceof Response) return checked;

    const id = nextId();
    const created: LeaveRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `CTI-${String(id).padStart(4, "0")}`,
      karyawanId: parsed.karyawanId,
      leaveTypeId: parsed.leaveTypeId,
      startDate: parsed.startDate,
      endDate: parsed.endDate,
      totalDays: String(checked.totalDays),
      reason: parsed.reason,
      status: "PENDING",
      rejectedReason: null,
      approvedAt: null,
      approval: null,
      deletedAt: null,
    };
    LEAVE_REQUEST.push(created);

    return json(
      { status: 201, message: "Berhasil Mengajukan Cuti", data: view(created) },
      201,
    );
  }

  if (!code) return null;

  const found = findRow(code);
  if (!found) return notFound();

  if (method === "GET" && !suffix) {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Pengajuan Cuti",
      data: view(found),
    });
  }

  if (method === "PUT" && !suffix) {
    const blocked = assertEditable(found);
    if (blocked) return blocked;

    const parsed = parse(await readBody<Body>(request));
    if (parsed.failure) return parsed.failure;

    const checked = await assertSavable(parsed, found.id);
    if (checked instanceof Response) return checked;

    found.karyawanId = parsed.karyawanId;
    found.leaveTypeId = parsed.leaveTypeId;
    found.startDate = parsed.startDate;
    found.endDate = parsed.endDate;
    found.totalDays = String(checked.totalDays);
    found.reason = parsed.reason;

    return json({
      status: 200,
      message: "Berhasil Mengubah Pengajuan Cuti",
      data: view(found),
    });
  }

  if (method === "DELETE" && !suffix) {
    const blocked = assertEditable(found);
    if (blocked) return blocked;

    found.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Pengajuan Cuti",
      data: view(found),
    });
  }

  if (method === "POST" && suffix === "/pengajuan") {
    if (found.status !== "PENDING") {
      return json(
        { status: 400, error: "Pengajuan Cuti Ini Sudah Diproses" },
        400,
      );
    }

    found.approval = {
      publicId: crypto.randomUUID(),
      code: `APR-${String(900 + found.id)}`,
      status: "PENDING",
      currentOrder: 1,
      steps: [
        {
          order: 1,
          approverRoleName: "Sekretaris Jemaat",
          status: "PENDING",
          note: null,
          actedAt: null,
          actor: null,
        },
        {
          order: 2,
          approverRoleName: "Majelis Jemaat",
          status: "PENDING",
          note: null,
          actedAt: null,
          actor: null,
        },
      ],
    };

    return json(
      {
        status: 201,
        message: "Berhasil Mengajukan Cuti Untuk Persetujuan",
        data: found.approval,
      },
      201,
    );
  }

  if (method === "PUT" && suffix === "/batal") {
    if (found.status !== "APPROVED") {
      return json(
        {
          status: 400,
          error: "Hanya Cuti Yang Sudah Disetujui Yang Dapat Dibatalkan",
        },
        400,
      );
    }

    if (found.startDate <= TODAY) {
      return json(
        {
          status: 400,
          error:
            "Cuti Ini Sudah Berjalan Atau Sudah Lewat. Pembatalan Hanya Sebelum Tanggal Mulai",
        },
        400,
      );
    }

    found.status = "CANCELLED";

    return json({
      status: 200,
      message: "Berhasil Membatalkan Cuti",
      data: view(found),
    });
  }

  return null;
};
