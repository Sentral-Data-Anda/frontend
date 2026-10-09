import type { SelectOption } from "@/components/common/control";
import type { ListFilter } from "@/components/common/list";
import { MENU, menuHref, type MenuSlug } from "@/config/menu";
import { APP_TIMEZONE } from "@/config/site";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { addDays, todayJakarta } from "@/lib/date";
import { formatDate, formatDateShort, formatDateTime } from "@/lib/format";

import type { ActionKind, ActivityLog, LogKind } from "./types";

export const ACTIVITY_LOG_LIST_PATH = menuHref(
  MENU.SETTINGS,
  MENU.ACTIVITY_LOG,
);

export const ACTION_LABEL: Record<ActionKind, string> = {
  create: "Tambah",
  update: "Ubah",
  softDelete: "Hapus",
  restore: "Pulihkan",
  delete: "Hapus permanen",
};

export function actionKindOf(
  log: Pick<ActivityLog, "action" | "oldData" | "newData">,
): ActionKind {
  if (log.action !== "update") return log.action;

  const deletedAt = log.newData?.deletedAt;

  if (deletedAt) return "softDelete";
  if (deletedAt === null && log.oldData?.deletedAt) return "restore";

  return "update";
}

const KIND_FROM_SERVER: Record<LogKind, ActionKind> = {
  create: "create",
  update: "update",
  hapus: "softDelete",
  pulihkan: "restore",
  delete: "delete",
};

export const actionKindFromServer = (kind: LogKind): ActionKind =>
  KIND_FROM_SERVER[kind] ?? "update";

export const isDeleteKind = (kind: ActionKind) =>
  kind === "softDelete" || kind === "delete";

export const MODEL_LABEL: Record<string, string> = {
  Jemaat: "Jemaat",
  AdditionalInformation: "Riwayat Jemaat",
  Profession: "Pekerjaan",
  EthnicGroup: "Suku",
  RoleJemaat: "Role Jemaat",
  BadanPelayananRule: "Aturan Badan Pelayanan",
  BadanPelayanan: "Badan Pelayanan",
  User: "Akun",
  RoleUser: "Role User",
  Menu: "Menu",
  RoleMenuAccess: "Akses Menu Role",
  Session: "Sesi Login",
  LoginAttempt: "Percobaan Login",
  Attachment: "Lampiran",
  TypeItem: "Tipe Barang",
  Asset: "Aset",
  StockItem: "Barang Stok",
  Room: "Ruangan",
  Event: "Event",
  Gallery: "Galeri",
  LoanRoom: "Peminjaman Ruang",
  RolePelayan: "Peran Pelayan",
  MusikSkill: "Keahlian Musik",
  Pelayan: "Pelayan",
  GroupPelayan: "Grup Pelayan",
  GroupPelayanMember: "Anggota Grup Pelayan",
  TemplateJadwalPelayan: "Templat Jadwal Pelayan",
  DetailTemplatePelayan: "Rincian Templat Pelayan",
  JadwalPelayan: "Jadwal Pelayan",
  DetailJadwalPelayan: "Rincian Jadwal Pelayan",
  Provinces: "Provinsi",
  Regencies: "Kabupaten/Kota",
  Districts: "Kecamatan",
  Villages: "Kelurahan/Desa",
  ZoneChurch: "Wilayah",
  Unit: "Satuan",
  Supplier: "Supplier",
  Account: "Akun Perkiraan",
  Karyawan: "Karyawan",
  Keluarga: "Keluarga",
  KeluargaMember: "Anggota Keluarga",
  Marriage: "Pernikahan",
  Currency: "Mata Uang",
  BudgetAllocation: "Pagu Anggaran",
  BudgetAllocationLine: "Rincian Pagu Anggaran",
  BudgetUsageReport: "Laporan Penggunaan Anggaran",
  BudgetUsageReportLine: "Rincian Laporan Penggunaan Anggaran",
  ApprovalWorkflowConfig: "Alur Persetujuan",
  ApprovalWorkflowStep: "Tahap Alur Persetujuan",
  PurchaseRequest: "Permintaan Pembelian",
  PurchaseRequestItem: "Barang Permintaan Pembelian",
  ApprovalRequest: "Permintaan Persetujuan",
  ApprovalRequestStep: "Tahap Permintaan Persetujuan",
  PurchaseOrder: "Pesanan Pembelian",
  PurchaseOrderItem: "Barang Pesanan Pembelian",
  GoodsReceipt: "Penerimaan Barang",
  GoodsReceiptItem: "Barang Penerimaan",
  Payment: "Pembayaran",
  PaymentNotificationLog: "Notifikasi Pembayaran",
  TypePersembahan: "Jenis Persembahan",
  Persembahan: "Persembahan",
  EventRegistration: "Pendaftaran Event",
  StockMovement: "Mutasi Stok",
  AssetMaintenance: "Pemeliharaan Aset",
  AssetTransfer: "Pemindahan Aset",
  AssetDisposal: "Pelepasan Aset",
  DepreciationRun: "Proses Penyusutan",
  DepreciationEntry: "Entri Penyusutan",
  PayrollComponent: "Komponen Gaji",
  KaryawanPayrollComponent: "Komponen Gaji Karyawan",
  PayrollRun: "Proses Payroll",
  Payslip: "Slip Gaji",
  PayslipLine: "Rincian Slip Gaji",
  FiscalPeriod: "Periode Fiskal",
  JournalEntry: "Jurnal",
  JournalLine: "Baris Jurnal",
  SupplierInvoice: "Faktur Supplier",
  SupplierInvoicePayment: "Pembayaran Faktur Supplier",
  DocumentSequence: "Penomoran Dokumen",
  AccountingSetting: "Pengaturan Akuntansi",
  CashExpense: "Kas Keluar",
  CashExpenseLine: "Rincian Kas Keluar",
  CashReceipt: "Kas Masuk",
  CashReceiptLine: "Rincian Kas Masuk",
  TypeIbadah: "Jenis Ibadah",
  Ibadah: "Ibadah",
  IbadahAttendance: "Kehadiran Ibadah",
  StockOpname: "Stok Opname",
  StockOpnameItem: "Barang Stok Opname",
  NotificationLog: "Log Notifikasi",
  PtkpRate: "Tarif PTKP",
  TaxBracket: "Lapisan Tarif Pajak",
  Program: "Program",
  ExchangeRate: "Kurs",
  KaryawanContract: "Kontrak Karyawan",
  LeaveType: "Jenis Cuti",
  LeaveRequest: "Pengajuan Cuti",
  KaryawanAttendance: "Kehadiran Karyawan",
  PurchaseReturn: "Retur Pembelian",
  PurchaseReturnItem: "Barang Retur Pembelian",
  Announcement: "Pengumuman",
  ProgramBudgetItem: "Anggaran Program",
};

export const modelLabel = (model: string) => MODEL_LABEL[model] ?? model;

export const logTitle = (kind: ActionKind, model: string) =>
  `${ACTION_LABEL[kind]} ${modelLabel(model)}`;

const clockFormat = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIMEZONE,
});

export function formatLogTime(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? "-"
    : `${formatDateShort(todayJakarta(date))} ${clockFormat.format(date)}`;
}

export const actorName = (user: ActivityLog["user"]) =>
  user === null ? "Sistem" : user?.name;

export type LogFilterKey =
  "periode" | "aksi" | "aksiHapus" | "data" | "pengguna";

export const SUPPORTED_FILTERS: readonly LogFilterKey[] = ["aksi"];

const FILTER_KEYS = ["periode", "aksi", "data", "pengguna"] as const;

export const filterSchemaOf = (
  supported: readonly LogFilterKey[],
): ListFilterSchema =>
  Object.fromEntries(
    FILTER_KEYS.filter((key) => supported.includes(key)).map((key) => [
      key,
      { api: key },
    ]),
  );

export const LIST_FILTERS = filterSchemaOf(SUPPORTED_FILTERS);

const PERIOD_OPTIONS: SelectOption[] = [
  { value: "1", label: "Hari ini" },
  { value: "7", label: "7 hari" },
  { value: "30", label: "30 hari" },
  { value: "", label: "Semua" },
];

const ACTION_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua" },
  { value: "create", label: ACTION_LABEL.create },
  { value: "update", label: ACTION_LABEL.update },
];

const DELETE_OPTION: SelectOption = {
  value: "hapus",
  label: ACTION_LABEL.softDelete,
};

const MODEL_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua data" },
  ...Object.entries(MODEL_LABEL)
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "id")),
];

export function listLogFilters(
  userOptions: readonly SelectOption[],
  supported: readonly LogFilterKey[] = SUPPORTED_FILTERS,
): ListFilter[] {
  const filters: (ListFilter & { key: LogFilterKey })[] = [
    {
      key: "periode",
      label: "Periode",
      kind: "choice",
      options: PERIOD_OPTIONS,
    },
    {
      key: "aksi",
      label: "Aksi",
      kind: "choice",
      options: supported.includes("aksiHapus")
        ? [...ACTION_OPTIONS, DELETE_OPTION]
        : ACTION_OPTIONS,
    },
    { key: "data", label: "Data", kind: "select", options: MODEL_OPTIONS },
    {
      key: "pengguna",
      label: "Pengguna",
      kind: "select",
      options: [{ value: "", label: "Semua pengguna" }, ...userOptions],
      emptyMessage: "Belum ada data pengguna",
    },
  ];

  return filters.filter((filter) => supported.includes(filter.key));
}

export function toLogApiFilters(
  filters: Record<string, string>,
  today: string,
): Record<string, string> {
  const days = Number(filters.periode);
  const action = filters.aksi ?? "";
  const isSoftDelete = action === DELETE_OPTION.value;

  return {
    dateFrom: days > 0 ? addDays(today, 1 - days) : "",
    dateTo: days > 0 ? today : "",
    action: isSoftDelete ? "" : action,
    kind: isSoftDelete ? "hapus" : "",
    model: filters.data ?? "",
    user: filters.pengguna ?? "",
  };
}

const AUDIT_KEYS = new Set([
  "id",
  "publicId",
  "createdBy",
  "createdAt",
  "updatedBy",
  "updatedAt",
  "deletedBy",
]);

export type Change = { field: string; before: unknown; after: unknown };

export const isOneSided = (action: ActivityLog["action"]) =>
  action !== "update";

export function listChanges(
  log: Pick<ActivityLog, "action" | "oldData" | "newData">,
): Change[] {
  const before = log.oldData ?? {};
  const after = log.newData ?? {};
  const fields = Object.keys(log.action === "delete" ? before : after);

  return fields
    .filter((field) => !AUDIT_KEYS.has(field))
    .filter(
      (field) =>
        log.action !== "update" ||
        JSON.stringify(before[field]) !== JSON.stringify(after[field]),
    )
    .map((field) => ({ field, before: before[field], after: after[field] }));
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

const MIDNIGHT_UTC = /T00:00:00(\.000)?Z$/;

export type ChangeValue = { text: string | null; isJson: boolean };

export function formatChangeValue(value: unknown): ChangeValue {
  if (value === null || value === undefined || value === "") {
    return { text: null, isJson: false };
  }
  if (typeof value === "boolean") {
    return { text: value ? "Ya" : "Tidak", isJson: false };
  }
  if (typeof value === "object") {
    return { text: JSON.stringify(value, null, 2), isJson: true };
  }
  if (typeof value === "string" && ISO_INSTANT.test(value)) {
    return {
      text: MIDNIGHT_UTC.test(value)
        ? formatDate(value)
        : formatDateTime(value),
      isJson: false,
    };
  }

  return { text: String(value), isJson: false };
}

const RECORD_SCREEN: Record<string, MenuSlug> = {
  Jemaat: MENU.DAFTAR_JEMAAT,
  Keluarga: MENU.KELUARGA,
  ZoneChurch: MENU.WILAYAH,
};

export function recordLinkOf(
  log: Pick<ActivityLog, "model" | "oldData" | "newData">,
): { menu: MenuSlug; href: string } | null {
  const menu = RECORD_SCREEN[log.model];
  const code = log.newData?.code ?? log.oldData?.code;

  if (!menu || typeof code !== "string" || !code) return null;

  return {
    menu,
    href: `${menuHref(MENU.KEJEMAATAN, menu)}?search=${encodeURIComponent(code)}`,
  };
}
