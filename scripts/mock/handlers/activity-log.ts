/**
 * Tiruan `/api/v1/activity-log` (be-sada `modules/activity_log`) beserta semua
 * filter B7 (`dateFrom`/`dateTo`, `model`, `user`, `filter`, `kind=hapus`), dan
 * `GET /ddl/user`. Baris ditulis seperti ekstensi Prisma `config/activityLog.ts`:
 * `oldData` seluruh baris, `newData` argumen `data`, tanpa `password`/`token`.
 *
 *   MOCK_LOG_500=1   → daftar dan detail log menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { todayJakarta } from "../../../src/lib/date";
import { denied, json, list, type MockHandler } from "../kit";

// Semua model be-sada `schema.prisma` kecuali ActivityLog (tidak pernah dicatat).
export const PRISMA_MODELS = [
  "Jemaat",
  "AdditionalInformation",
  "Profession",
  "EthnicGroup",
  "RoleJemaat",
  "BadanPelayananRule",
  "BadanPelayanan",
  "User",
  "RoleUser",
  "Menu",
  "RoleMenuAccess",
  "Session",
  "LoginAttempt",
  "Attachment",
  "TypeItem",
  "Asset",
  "StockItem",
  "Room",
  "Event",
  "Gallery",
  "LoanRoom",
  "RolePelayan",
  "MusikSkill",
  "Pelayan",
  "GroupPelayan",
  "GroupPelayanMember",
  "TemplateJadwalPelayan",
  "DetailTemplatePelayan",
  "JadwalPelayan",
  "DetailJadwalPelayan",
  "Provinces",
  "Regencies",
  "Districts",
  "Villages",
  "ZoneChurch",
  "Unit",
  "Supplier",
  "Account",
  "Karyawan",
  "Keluarga",
  "KeluargaMember",
  "Marriage",
  "Currency",
  "BudgetAllocation",
  "BudgetAllocationLine",
  "BudgetUsageReport",
  "BudgetUsageReportLine",
  "ApprovalWorkflowConfig",
  "ApprovalWorkflowStep",
  "PurchaseRequest",
  "PurchaseRequestItem",
  "ApprovalRequest",
  "ApprovalRequestStep",
  "PurchaseOrder",
  "PurchaseOrderItem",
  "GoodsReceipt",
  "GoodsReceiptItem",
  "Payment",
  "PaymentNotificationLog",
  "TypePersembahan",
  "Persembahan",
  "EventRegistration",
  "StockMovement",
  "AssetMaintenance",
  "AssetTransfer",
  "AssetDisposal",
  "DepreciationRun",
  "DepreciationEntry",
  "PayrollComponent",
  "KaryawanPayrollComponent",
  "PayrollRun",
  "Payslip",
  "PayslipLine",
  "FiscalPeriod",
  "JournalEntry",
  "JournalLine",
  "SupplierInvoice",
  "SupplierInvoicePayment",
  "DocumentSequence",
  "AccountingSetting",
  "CashExpense",
  "CashExpenseLine",
  "CashReceipt",
  "CashReceiptLine",
  "TypeIbadah",
  "Ibadah",
  "IbadahAttendance",
  "StockOpname",
  "StockOpnameItem",
  "NotificationLog",
  "PtkpRate",
  "TaxBracket",
  "Program",
  "ExchangeRate",
  "KaryawanContract",
  "LeaveType",
  "LeaveRequest",
  "KaryawanAttendance",
  "PurchaseReturn",
  "PurchaseReturnItem",
  "Announcement",
  "ProgramBudgetItem",
];

type Data = Record<string, unknown>;

type Actor = { id: number; code: string; name: string };

type Row = {
  id: number;
  publicId: string;
  action: "create" | "update" | "delete";
  model: string;
  recordId: string;
  oldData: Data | null;
  newData: Data | null;
  username: null;
  ipAddress: null;
  userAgent: null;
  method: null;
  path: null;
  createdAt: string;
  actor: Actor | null;
};

type Entry = Pick<Row, "action" | "model" | "recordId" | "oldData" | "newData">;

const ACTORS: Actor[] = [
  { id: 1, code: "U-0001", name: "Admin Sistem" },
  { id: 2, code: "U-0002", name: "Debora Manurung" },
  { id: 3, code: "U-0003", name: "Yosua Sembiring" },
  { id: 4, code: "U-0004", name: "Hanna Simorangkir" },
];

const SEEDED_AT = "2026-01-05T02:00:00.000Z";

const auditOf = (id: number, actorId: number) => ({
  id,
  publicId: `3f6c2a10-0000-4000-8000-${String(id).padStart(12, "0")}`,
  createdBy: actorId,
  createdAt: SEEDED_AT,
  updatedBy: null,
  updatedAt: SEEDED_AT,
  deletedBy: null,
  deletedAt: null,
});

const NAMES = [
  "Andreas Sitanggang",
  "Bethari Ayu Kusuma",
  "Christian Wijaya",
  "Debora Manurung",
  "Eleazar Panggabean",
  "Fransiska Halim",
  "Gideon Tampubolon",
  "Hanna Simorangkir",
  "Immanuel Saragih",
  "Josephine Tanuwijaya",
  "Kevin Nainggolan",
  "Lidya Hutagalung",
];

const jemaatData = (n: number): Data => ({
  code: `JMT-${String(n).padStart(4, "0")}`,
  name: NAMES[(n - 1) % NAMES.length],
  gender: n % 2 ? "L" : "P",
  birthPlace: "Medan",
  birthDate: `19${70 + (n % 25)}-0${1 + (n % 9)}-1${n % 9}T00:00:00.000Z`,
  phone: `08121234${String(5000 + n)}`,
  email: null,
  address:
    "Jl. Kapten Muslim Gg. Sepakat No. 17, Kelurahan Dwi Kora, Kecamatan Medan Helvetia",
  typeJemaat: "ANGGOTA",
  statusJemaat: "AKTIF",
  isBaptized: true,
  zoneChurchId: 1 + (n % 4),
  keluargaId: n,
});

const jemaatRow = (n: number, actorId: number): Data => ({
  ...auditOf(n, actorId),
  ...jemaatData(n),
});

const MENU_ACCESS = [
  { menuId: 3, action: ["VIEW", "CREATE", "UPDATE", "DELETE"] },
  { menuId: 4, action: ["VIEW", "CREATE", "UPDATE"] },
  { menuId: 7, action: ["VIEW"] },
  { menuId: 12, action: ["VIEW", "CREATE"] },
  { menuId: 15, action: ["VIEW"] },
];

const TEMPLATES: ((n: number, actorId: number) => Entry)[] = [
  (n, actorId) => {
    const old = jemaatRow(n, actorId);

    return {
      action: "update",
      model: "Jemaat",
      recordId: String(n),
      oldData: old,
      newData: {
        phone: `08139876${String(5000 + n)}`,
        email: `${String(old.name).split(" ")[0].toLowerCase()}@gmail.com`,
        zoneChurchId: old.zoneChurchId,
        updatedBy: actorId,
        updatedAt: new Date().toISOString(),
      },
    };
  },
  (n, actorId) => ({
    action: "create",
    model: "Jemaat",
    recordId: String(n + 40),
    oldData: null,
    newData: { ...jemaatData(n + 40), createdBy: actorId },
  }),
  (n) => ({
    action: "update",
    model: "Keluarga",
    recordId: String(n),
    oldData: {
      ...auditOf(n, 2),
      code: `KEL-${n}`,
      name: `Keluarga ${NAMES[n % NAMES.length].split(" ")[1]}`,
      zoneChurchId: 2,
      address: "Jl. Setia Budi No. 42, Medan",
    },
    newData: { zoneChurchId: 3, updatedBy: 2 },
  }),
  (n, actorId) => ({
    action: "update",
    model: "Jemaat",
    recordId: String(n + 3),
    oldData: jemaatRow(n + 3, actorId),
    newData: { deletedAt: new Date().toISOString(), deletedBy: actorId },
  }),
  (n, actorId) => ({
    action: "update",
    model: "BadanPelayanan",
    recordId: String(1 + (n % 6)),
    oldData: {
      ...auditOf(1 + (n % 6), 1),
      code: `BPL-000${1 + (n % 6)}`,
      name: "Komisi Pemuda",
      description: "Pelayanan pemuda usia 17–30 tahun",
      isActive: true,
    },
    newData: {
      name: "Komisi Pemuda dan Remaja",
      description: "Pelayanan pemuda dan remaja usia 13–30 tahun",
      updatedBy: actorId,
    },
  }),
  (n) => ({
    action: "delete",
    model: "KeluargaMember",
    recordId: String(200 + n),
    oldData: {
      ...auditOf(200 + n, 2),
      keluargaId: n,
      jemaatId: n + 12,
      roleInFamily: "ANAK",
      joinedAt: "2019-07-14T00:00:00.000Z",
      endedAt: null,
    },
    newData: null,
  }),
  (n, actorId) => ({
    action: "update",
    model: "ZoneChurch",
    recordId: String(5),
    oldData: {
      ...auditOf(5, 1),
      code: "ZC-0005",
      name: "Wilayah V",
      isActive: true,
    },
    newData: { isActive: n % 2 === 0, updatedBy: actorId },
  }),
  (n, actorId) => ({
    action: "create",
    model: "Profession",
    recordId: String(30 + n),
    oldData: null,
    newData: { name: n % 2 ? "Perawat" : "Arsitek", createdBy: actorId },
  }),
  (n, actorId) => ({
    action: "update",
    model: "Jemaat",
    recordId: String(n + 5),
    oldData: {
      ...jemaatRow(n + 5, actorId),
      deletedAt: "2026-08-02T03:15:00.000Z",
      deletedBy: 2,
    },
    newData: { deletedAt: null, deletedBy: null, updatedBy: actorId },
  }),
  (n, actorId) => ({
    action: "create",
    model: "AdditionalInformation",
    recordId: String(500 + n),
    oldData: null,
    newData: {
      jemaatId: n,
      type: "SIDI",
      date: "2026-04-05T00:00:00.000Z",
      place: "GKI Sumatera Utara, Jemaat Medan Kota",
      letterNumber: `012/SIDI/IV/2026/${n}`,
      createdBy: actorId,
    },
  }),
  (n, actorId) => ({
    action: "create",
    model: "Marriage",
    recordId: String(40 + n),
    oldData: null,
    newData: {
      husbandId: n + 1,
      wifeId: n + 2,
      marriedAt: "2026-06-20T00:00:00.000Z",
      place: "Gedung Gereja Induk",
      createdBy: actorId,
    },
  }),
  (n, actorId) => ({
    action: "create",
    model: "EthnicGroup",
    recordId: String(20 + n),
    oldData: null,
    newData: { name: "Nias", createdBy: actorId },
  }),
];

const ROLE_USER_ENTRY: Entry = {
  action: "update",
  model: "RoleUser",
  recordId: "3",
  oldData: {
    ...auditOf(3, 1),
    name: "Operator Sistem",
    isAdmin: false,
  },
  newData: {
    name: "Operator Sistem",
    isAdmin: false,
    menuAccess: { deleteMany: {}, create: MENU_ACCESS },
    updatedBy: 1,
  },
};

const USER_STATUS_ENTRY: Entry = {
  action: "update",
  model: "User",
  recordId: "7",
  oldData: {
    ...auditOf(7, 1),
    code: "U-0007",
    username: "kevin.n",
    status: "ACTIVE",
    roleUserId: 2,
    jemaatId: 11,
    lastLoginAt: "2026-09-20T01:12:00.000Z",
  },
  newData: { status: "INACTIVE", updatedBy: 1 },
};

const HOUR = 60 * 60 * 1000;
const COUNT = 80;
const startedAt = Date.now();

const rows: Row[] = Array.from({ length: COUNT }, (_, index) => {
  const n = index + 1;
  const actor = n % 9 === 0 ? null : ACTORS[n % ACTORS.length];
  const entry =
    index === 1
      ? ROLE_USER_ENTRY
      : index === 4
        ? USER_STATUS_ENTRY
        : TEMPLATES[index % TEMPLATES.length](n, actor?.id ?? 1);

  return {
    id: COUNT - index,
    publicId: `8a1d4c2e-0000-4000-9000-${String(COUNT - index).padStart(12, "0")}`,
    ...entry,
    username: null,
    ipAddress: null,
    userAgent: null,
    method: null,
    path: null,
    createdAt: new Date(
      startedAt - index * 13 * HOUR - 7 * 60_000,
    ).toISOString(),
    actor,
  };
});

const dayOf = (row: Row) => todayJakarta(new Date(row.createdAt));

const isMatch = (row: Row, query: URLSearchParams) => {
  const read = (key: string) => query.get(key) ?? "";
  const day = dayOf(row);

  if (read("date") && day !== read("date")) return false;
  if (read("dateFrom") && day < read("dateFrom")) return false;
  if (read("dateTo") && day > read("dateTo")) return false;
  if (read("action") && row.action !== read("action")) return false;
  if (read("model") && row.model !== read("model")) return false;
  if (read("user") && row.actor?.code !== read("user")) return false;
  if (read("filter") && row.recordId !== read("filter").trim()) return false;
  if (
    read("kind") === "hapus" &&
    (row.action !== "update" || !row.newData?.deletedAt)
  ) {
    return false;
  }

  return true;
};

const listView = ({ actor, ...row }: Row) => ({
  ...row,
  user: actor ? { name: actor.name } : null,
});

const detailView = ({ actor, ...row }: Row) => ({
  ...row,
  user: actor ? { name: actor.name, code: actor.code } : null,
});

const failed = () =>
  json({ status: 500, error: "Terjadi kesalahan pada server" }, 500);

const ddlUser = (url: URL) => {
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
  const limit = Number(url.searchParams.get("limit")) || ACTORS.length;
  const data = [...ACTORS]
    .sort((a, b) => a.name.localeCompare(b.name, "id"))
    .filter((actor) => actor.name.toLowerCase().includes(filter))
    .slice(0, limit);

  if (process.env.MOCK_DDL_EMPTY || data.length === 0) {
    return json({ status: 404, error: "Data Tidak Ditemukan" }, 404);
  }

  return json({ status: 200, message: "Berhasil Mendapatkan Data", data });
};

export const activityLogMock: MockHandler = ({ url, path, method, can }) => {
  if (path === "/ddl/user" && method === "GET") {
    return can(MENU.USER, "VIEW") || can(MENU.ACTIVITY_LOG, "VIEW")
      ? ddlUser(url)
      : denied();
  }
  if (path !== "/activity-log" && !path.startsWith("/activity-log/")) {
    return null;
  }
  if (method !== "GET") return null;
  if (!can(MENU.ACTIVITY_LOG, "VIEW")) return denied();
  if (process.env.MOCK_LOG_500) return failed();

  const id = path.match(/^\/activity-log\/([^/]+)$/)?.[1];

  if (id) {
    const row = rows.find((item) => String(item.id) === id);

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Activity Log",
          data: detailView(row),
        })
      : json({ status: 404, error: "Activity Log Tidak Ditemukan" }, 404);
  }

  return list(
    rows.filter((row) => isMatch(row, url.searchParams)).map(listView),
    url,
    "Activity Log",
    "Activity Log",
  );
};
