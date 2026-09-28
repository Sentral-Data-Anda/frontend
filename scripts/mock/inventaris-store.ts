/**
 * State mock bersama grup Inventaris (docs/design/inventaris/README.md §4a TL-7).
 * Larik diisi agent fitur saat runtime; bentuk tampilan dan aturan milik TL.
 * Bentuk respons = be-sada sesudah gap B1–B26. Tanggal relatif hari ini (WIB).
 * Barang dan persediaan hanya di Gedung Gereja dan Aula, supaya ruang lain tetap
 * bisa dihapus di layar Ruang.
 */
import { addDays, addMonths, startOfMonth } from "../../src/lib/date";
import { currentPersona, SESSION_USER_ID } from "../mock-dashboard";

import { ROOM, TODAY, bapelOf, isLive, nextId } from "./fasilitas-store";
import { mediaUrl, seedImage } from "./media";

export { TODAY, isLive, nextId };

type Live = { id: number; deletedAt: string | null };

export type MasterRow = Live & { publicId: string; code: string; name: string };

export type SupplierRow = { id: number; code: string; name: string };

export type AssetPhoto = {
  publicId: string;
  path: string;
  name: string;
  mimeType: string;
  size: number;
};

export type AssetCondition = "BAIK" | "RUSAK_RINGAN" | "RUSAK_BERAT" | "HILANG";

export type AcquisitionSource = "PURCHASE" | "DONATION" | "GRANT";

export type AssetRow = Live & {
  publicId: string;
  code: string;
  name: string;
  description: string;
  serialNumber: string | null;
  condition: AssetCondition;
  warrantyUntil: string | null;
  acquisitionSource: AcquisitionSource;
  donorName: string | null;
  acquisitionDate: string | null;
  acquisitionCost: number | null;
  isDepreciable: boolean;
  salvageValue: number | null;
  usefulLifeMonths: number | null;
  depreciationStartDate: string | null;
  openingAccumulatedDepreciation: number | null;
  openingAccumulatedAsOf: string | null;
  typeId: number;
  bapelId: number;
  roomId: number;
  mainImage: AssetPhoto | null;
  detailImage: AssetPhoto[];
};

export type StockItemRow = Live & {
  publicId: string;
  code: string;
  name: string;
  description: string | null;
  quantity: number;
  reorderPoint: number | null;
  lastUnitPrice: number | null;
  typeId: number;
  bapelId: number;
  roomId: number;
  unitId: number;
};

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export type MovementSource =
  | "OPENING_BALANCE"
  | "GOODS_RECEIPT"
  | "DONATION"
  | "USAGE"
  | "TRANSFER"
  | "DISPOSAL"
  | "STOCK_OPNAME"
  | "PURCHASE_RETURN"
  | "MANUAL";

export type MovementRow = {
  id: number;
  publicId: string;
  stockItemId: number;
  type: MovementType;
  source: MovementSource;
  quantity: number;
  balanceAfter: number;
  movementDate: string;
  note: string | null;
  createdAt: string;
};

export type OpnameStatus = "DRAFT" | "COMPLETED" | "POSTED" | "CANCELLED";

export type OpnameItem = {
  publicId: string;
  stockItemId: number;
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  note: string | null;
};

export type OpnameRow = {
  id: number;
  publicId: string;
  code: string;
  opnameDate: string;
  status: OpnameStatus;
  roomId: number | null;
  note: string | null;
  completedById: number | null;
  completedAt: string | null;
  postedById: number | null;
  postedAt: string | null;
  items: OpnameItem[];
};

export type MaintenanceStatus =
  "SCHEDULED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export type MaintenanceRow = Live & {
  publicId: string;
  code: string;
  assetId: number;
  status: MaintenanceStatus;
  scheduledDate: string;
  completedDate: string | null;
  description: string;
  cost: number | null;
  supplierId: number | null;
  performedBy: string | null;
};

export type TransferRow = {
  id: number;
  publicId: string;
  code: string;
  assetId: number;
  fromRoomId: number;
  toRoomId: number;
  fromBapelId: number;
  toBapelId: number;
  transferDate: string;
  reason: string | null;
};

export type DisposalMethod = "SOLD" | "SCRAPPED" | "DONATED" | "LOST";

export type DisposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type DisposalRow = {
  id: number;
  publicId: string;
  code: string;
  assetId: number;
  method: DisposalMethod;
  disposalDate: string;
  reason: string;
  proceeds: number;
  status: DisposalStatus;
  approvedAt: string | null;
  submittedBy: number;
  rejectionNote: string | null;
  approval: { id: number; publicId: string; code: string } | null;
};

export type RunEntry = {
  publicId: string;
  assetId: number;
  amount: number;
  accumulatedAfter: number;
  bookValueAfter: number;
};

export type RunRow = {
  id: number;
  publicId: string;
  code: string;
  year: number;
  month: number;
  status: "DRAFT" | "POSTED";
  totalAmount: number;
  createdAt: string;
  updatedAt: string | null;
  postedAt: string | null;
  journalCode: string | null;
  entries: RunEntry[];
};

export type Failure = { status: number; message: string; path?: string };

const YEAR = TODAY.slice(0, 4);

const pad = (value: number, size = 4) => String(value).padStart(size, "0");

const uuid = (group: string, id: number) =>
  `00000000-0000-4000-${group}-${pad(id, 12)}`;

const iso = (key: string | null) => (key ? `${key}T00:00:00.000Z` : null);

const stamp = (key: string) => `${key}T03:00:00.000Z`;

const day = (offset: number) => addDays(TODAY, offset);

const monthStart = (offset: number) => addMonths(startOfMonth(TODAY), offset);

const round2 = (value: number) => Math.round(value * 100) / 100;

export const money = (value: number | null) =>
  value === null ? null : value.toFixed(2);

const periodIndex = (key: string) =>
  Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;

const runIndex = (run: Pick<RunRow, "year" | "month">) =>
  run.year * 12 + run.month - 1;

const GEDUNG = 1;
const AULA = 2;

const MAJELIS = 1;
const PEMUDA = 2;
const MUSIK = 5;

const OTHER_USERS: Record<number, string> = {
  11: "Rina Situmorang",
  12: "Daniel Panjaitan",
  13: "Pnt. Hotman Sinaga",
};

export const userNameOf = (userId: number | null) => {
  if (userId === null) return null;
  const name =
    userId === SESSION_USER_ID
      ? currentPersona().jemaatName
      : OTHER_USERS[userId];

  return name ? { name } : null;
};

const counters = new Map<string, number>();

export const codeOf = (prefix: string, options: { yearly?: boolean } = {}) => {
  const key = options.yearly ? `${prefix}-${YEAR}` : prefix;
  const next = (counters.get(key) ?? 0) + 1;
  counters.set(key, next);

  return `${key}-${pad(next)}`;
};

const master = (
  prefix: string,
  group: string,
  names: string[],
  deleted: string,
): MasterRow[] => [
  ...names.map((name, index) => ({
    id: index + 1,
    publicId: uuid(group, index + 1),
    code: codeOf(prefix),
    name,
    deletedAt: null,
  })),
  {
    id: names.length + 1,
    publicId: uuid(group, names.length + 1),
    code: codeOf(prefix),
    name: deleted,
    deletedAt: stamp(day(-90)),
  },
];

export const TYPE_ITEM = master(
  "TYP_ITM",
  "d100",
  [
    "Elektronik",
    "Alat Musik",
    "Mebel",
    "Kendaraan",
    "ATK",
    "Perlengkapan Ibadah",
    "Kebersihan",
    "Dekorasi",
  ],
  "Lain-lain",
);

export const UNIT = master(
  "UNT",
  "d200",
  ["Buah", "Lusin", "Pak", "Rim", "Botol", "Kotak", "Lembar"],
  "Dus",
);

export const SUPPLIER: SupplierRow[] = [
  "CV Sinar Teknik",
  "Toko Musik Harmoni",
  "PT Sejuk Selalu",
  "Bengkel Jaya",
].map((name, index) => ({
  id: index + 1,
  code: `SUP-${pad(index + 1)}`,
  name,
}));

const TYPE = {
  ELEKTRONIK: 1,
  MUSIK: 2,
  MEBEL: 3,
  KENDARAAN: 4,
  ATK: 5,
  IBADAH: 6,
  KEBERSIHAN: 7,
} as const;

const UNIT_ID = { BUAH: 1, PAK: 3, RIM: 4, BOTOL: 5, KOTAK: 6 } as const;

export const typeItemOf = (id: number) =>
  TYPE_ITEM.find((row) => row.id === id && isLive(row));

export const unitOf = (id: number) =>
  UNIT.find((row) => row.id === id && isLive(row));

export const supplierOf = (id: number) => SUPPLIER.find((row) => row.id === id);

export const roomRowOf = (id: number) => ROOM.find((row) => row.id === id);

let photoCount = 0;

export const assetPhoto = (
  label: string,
  options: { hue: number; isMissing?: boolean },
): AssetPhoto => {
  photoCount += 1;
  const path = `asset/seed-${photoCount}.jpeg`;

  return {
    publicId: uuid("d300", photoCount),
    path,
    name: label,
    mimeType: "image/jpeg",
    size: options.isMissing ? 180_000 : seedImage(path, label, options.hue),
  };
};

export const assetPhotoView = (photo: AssetPhoto) => ({
  publicId: photo.publicId,
  name: photo.name,
  mimeType: photo.mimeType,
  size: photo.size,
  showOnWebsite: false,
  url: mediaUrl(photo.path),
});

export const assetCodeOf = (typeId: number, bapelId: number) => {
  const prefix = `AST_${pad(typeId)}_${pad(bapelId)}-`;
  const count = ASSET.filter((row) => row.code.startsWith(prefix)).length;

  return `${prefix}${pad(count + 1)}`;
};

type AssetSeed = Partial<AssetRow> &
  Pick<AssetRow, "name" | "typeId" | "bapelId" | "roomId">;

export const ASSET: AssetRow[] = [];

const asset = (seed: AssetSeed) => {
  const id = ASSET.length + 1;
  const row: AssetRow = {
    id,
    publicId: uuid("d400", id),
    code: assetCodeOf(seed.typeId, seed.bapelId),
    description: `${seed.name} milik gereja.`,
    serialNumber: null,
    condition: "BAIK",
    warrantyUntil: null,
    acquisitionSource: "PURCHASE",
    donorName: null,
    acquisitionDate: null,
    acquisitionCost: null,
    isDepreciable: false,
    salvageValue: null,
    usefulLifeMonths: null,
    depreciationStartDate: null,
    openingAccumulatedDepreciation: null,
    openingAccumulatedAsOf: null,
    mainImage: null,
    detailImage: [],
    deletedAt: null,
    ...seed,
  };
  ASSET.push(row);

  return row;
};

const photoSet = (label: string, hue: number, count: number) =>
  Array.from({ length: count }, (_, index) =>
    assetPhoto(`${label} ${index + 1}`, { hue: hue + index * 19 }),
  );

const openingOf = (
  cost: number,
  salvage: number,
  life: number,
  months: number,
) => round2(round2((cost - salvage) / life) * months);

const GO_LIVE_AS_OF = monthStart(-4);

const PROYEKTOR = asset({
  name: "Proyektor Epson EB-X51",
  description: "Proyektor utama ibadah raya, dipasang di balkon.",
  serialNumber: "X51-7Q2K9031",
  typeId: TYPE.ELEKTRONIK,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  acquisitionDate: monthStart(-14),
  acquisitionCost: 8_500_000,
  isDepreciable: true,
  salvageValue: 500_000,
  usefulLifeMonths: 48,
  depreciationStartDate: monthStart(-14),
  openingAccumulatedDepreciation: openingOf(8_500_000, 500_000, 48, 10),
  openingAccumulatedAsOf: GO_LIVE_AS_OF,
  warrantyUntil: day(200),
  mainImage: assetPhoto("Proyektor Epson", { hue: 200 }),
  detailImage: photoSet("Proyektor Epson", 210, 3),
});

const KEYBOARD = asset({
  name: "Keyboard Yamaha PSR-SX700",
  description: "Keyboard pengiring ibadah pemuda dan paduan suara.",
  serialNumber: "PSR-SX700-11823",
  typeId: TYPE.MUSIK,
  bapelId: MUSIK,
  roomId: AULA,
  acquisitionSource: "DONATION",
  donorName: "Keluarga Bpk. Simanjuntak",
  acquisitionDate: monthStart(-2),
  acquisitionCost: 12_000_000,
  isDepreciable: true,
  salvageValue: 0,
  usefulLifeMonths: 60,
  depreciationStartDate: monthStart(-2),
  mainImage: assetPhoto("Keyboard Yamaha", { hue: 280 }),
  detailImage: photoSet("Keyboard Yamaha", 290, 1),
});

const MIXER = asset({
  name: "Mixer Behringer X32",
  description: "Mixer audio ruang ibadah, 32 kanal.",
  typeId: TYPE.ELEKTRONIK,
  bapelId: MUSIK,
  roomId: GEDUNG,
  condition: "RUSAK_RINGAN",
  acquisitionCost: 28_000_000,
  mainImage: assetPhoto("Mixer Behringer", { hue: 20 }),
});

const KURSI_1 = asset({
  name: "Kursi Lipat Chitose",
  typeId: TYPE.MEBEL,
  bapelId: MAJELIS,
  roomId: AULA,
  acquisitionCost: 350_000,
});

asset({
  name: "Kursi Lipat Chitose",
  typeId: TYPE.MEBEL,
  bapelId: MAJELIS,
  roomId: AULA,
  acquisitionCost: 350_000,
});

const INNOVA = asset({
  name: "Toyota Innova Pelayanan",
  description: "Kendaraan pelayanan jemaat dan perlawatan.",
  serialNumber: "BK 1234 AB",
  typeId: TYPE.KENDARAAN,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  acquisitionDate: monthStart(-100),
  acquisitionCost: 250_000_000,
  isDepreciable: true,
  salvageValue: 50_000_000,
  usefulLifeMonths: 96,
  depreciationStartDate: monthStart(-100),
  openingAccumulatedDepreciation: 195_833_333.34,
  openingAccumulatedAsOf: GO_LIVE_AS_OF,
  mainImage: assetPhoto("Toyota Innova", { hue: 160 }),
});

const LEMARI = asset({
  name: "Lemari Arsip Besi",
  description: "Lemari arsip empat laci untuk berkas sekretariat.",
  typeId: TYPE.MEBEL,
  bapelId: MAJELIS,
  roomId: AULA,
  acquisitionSource: "GRANT",
  donorName: "Sinode",
  acquisitionCost: 2_500_000,
});

const AC = asset({
  name: "AC Daikin 2 PK",
  description: "Pendingin ruang ibadah sisi kiri.",
  typeId: TYPE.ELEKTRONIK,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  acquisitionDate: monthStart(-1),
  acquisitionCost: 6_000_000,
  isDepreciable: true,
  salvageValue: 0,
  usefulLifeMonths: 60,
  depreciationStartDate: monthStart(-1),
  warrantyUntil: day(30),
  mainImage: assetPhoto("AC Daikin", { hue: 190, isMissing: true }),
});

const PIANO = asset({
  name: "Piano Yamaha U1",
  description: "Piano akustik lama ruang ibadah.",
  typeId: TYPE.MUSIK,
  bapelId: MUSIK,
  roomId: GEDUNG,
  acquisitionCost: 45_000_000,
  isDepreciable: true,
  salvageValue: 5_000_000,
  usefulLifeMonths: 120,
  depreciationStartDate: monthStart(-30),
  openingAccumulatedDepreciation: openingOf(45_000_000, 5_000_000, 120, 26),
  openingAccumulatedAsOf: GO_LIVE_AS_OF,
  mainImage: assetPhoto("Piano Yamaha", { hue: 30 }),
});

const LAPTOP = asset({
  name: "Laptop Asus Sekretariat",
  typeId: TYPE.ELEKTRONIK,
  bapelId: MAJELIS,
  roomId: AULA,
  acquisitionCost: 7_000_000,
});

const PRINTER = asset({
  name: "Printer Canon G2010",
  typeId: TYPE.ELEKTRONIK,
  bapelId: MAJELIS,
  roomId: AULA,
  condition: "HILANG",
  acquisitionCost: 3_200_000,
  isDepreciable: true,
  salvageValue: 0,
  usefulLifeMonths: 48,
  depreciationStartDate: monthStart(-20),
  openingAccumulatedDepreciation: openingOf(3_200_000, 0, 48, 16),
  openingAccumulatedAsOf: GO_LIVE_AS_OF,
});

const SOUND = asset({
  name: "Sound Portable Huper",
  description: "Pengeras suara untuk kebaktian luar gedung.",
  typeId: TYPE.ELEKTRONIK,
  bapelId: PEMUDA,
  roomId: AULA,
  acquisitionCost: 4_800_000,
});

asset({
  name: "Kamera Canon EOS M50",
  description: "Kamera dokumentasi kegiatan.",
  typeId: TYPE.ELEKTRONIK,
  bapelId: PEMUDA,
  roomId: GEDUNG,
});

asset({
  name: "Genset Honda 5000 W",
  description: "Genset cadangan saat listrik padam.",
  typeId: TYPE.ELEKTRONIK,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  acquisitionCost: 15_000_000,
  warrantyUntil: day(-60),
});

asset({
  name: "Meja Lipat Lama",
  typeId: TYPE.MEBEL,
  bapelId: MAJELIS,
  roomId: AULA,
  deletedAt: stamp(day(-45)),
});

export const assetOf = (id: number) =>
  ASSET.find((row) => row.id === id && isLive(row));

export const MAINTENANCE: MaintenanceRow[] = [];
export const TRANSFER: TransferRow[] = [];
export const DISPOSAL: DisposalRow[] = [];

const skaCode = () => codeOf("SKA", { yearly: true });

const maintenance = (
  seed: Omit<MaintenanceRow, "id" | "publicId" | "code" | "deletedAt"> & {
    deletedAt?: string | null;
  },
) => {
  const id = MAINTENANCE.length + 1;
  MAINTENANCE.push({
    id,
    publicId: uuid("d500", id),
    code: skaCode(),
    deletedAt: null,
    ...seed,
  });
};

const transfer = (seed: Omit<TransferRow, "id" | "publicId" | "code">) => {
  const id = TRANSFER.length + 1;
  TRANSFER.push({ id, publicId: uuid("d600", id), code: skaCode(), ...seed });
};

const APPROVAL_BASE = 900;

export const approvalRefOf = (id: number) => ({
  id,
  publicId: `0b5e7a00-0000-4000-b000-${pad(id, 12)}`,
  code: `PST-${YEAR}-${pad(id)}`,
});

const disposal = (
  seed: Omit<
    DisposalRow,
    "id" | "publicId" | "code" | "approval" | "approvedAt" | "rejectionNote"
  > & { approvedAt?: string | null; rejectionNote?: string | null },
) => {
  const id = DISPOSAL.length + 1;
  const row: DisposalRow = {
    id,
    publicId: uuid("d700", id),
    code: skaCode(),
    approvedAt: null,
    rejectionNote: null,
    approval: approvalRefOf(APPROVAL_BASE + id),
    ...seed,
  };
  DISPOSAL.push(row);

  return row;
};

transfer({
  assetId: PROYEKTOR.id,
  fromRoomId: AULA,
  toRoomId: GEDUNG,
  fromBapelId: MAJELIS,
  toBapelId: MAJELIS,
  transferDate: day(-50),
  reason: "Dipakai tetap di ibadah raya.",
});
transfer({
  assetId: KEYBOARD.id,
  fromRoomId: AULA,
  toRoomId: AULA,
  fromBapelId: PEMUDA,
  toBapelId: MUSIK,
  transferDate: day(-40),
  reason: "Pengelolaan diserahkan ke Komisi Musik.",
});
transfer({
  assetId: KURSI_1.id,
  fromRoomId: GEDUNG,
  toRoomId: AULA,
  fromBapelId: MAJELIS,
  toBapelId: MAJELIS,
  transferDate: day(-30),
  reason: null,
});
transfer({
  assetId: LEMARI.id,
  fromRoomId: 3,
  toRoomId: AULA,
  fromBapelId: MAJELIS,
  toBapelId: MAJELIS,
  transferDate: day(-25),
  reason: "Ruang Pemuda dipakai kelas katekisasi.",
});

maintenance({
  assetId: PROYEKTOR.id,
  status: "SCHEDULED",
  scheduledDate: day(7),
  completedDate: null,
  description: "Bersihkan filter dan cek jam pakai lampu",
  cost: null,
  supplierId: 1,
  performedBy: null,
});
maintenance({
  assetId: MIXER.id,
  status: "IN_PROGRESS",
  scheduledDate: day(-3),
  completedDate: null,
  description: "Kanal 3 dan 4 berdesis",
  cost: null,
  supplierId: 2,
  performedBy: null,
});
maintenance({
  assetId: AC.id,
  status: "DONE",
  scheduledDate: day(-20),
  completedDate: day(-18),
  description: "Cuci AC dan isi freon",
  cost: 450_000,
  supplierId: 3,
  performedBy: null,
});
maintenance({
  assetId: KEYBOARD.id,
  status: "DONE",
  scheduledDate: day(-10),
  completedDate: day(-10),
  description: "Ganti adaptor yang rusak",
  cost: null,
  supplierId: null,
  performedBy: "Pak Yohanes",
});
maintenance({
  assetId: INNOVA.id,
  status: "CANCELLED",
  scheduledDate: day(-15),
  completedDate: null,
  description: "Servis berkala 100.000 km",
  cost: null,
  supplierId: 4,
  performedBy: null,
});
maintenance({
  assetId: PIANO.id,
  status: "DONE",
  scheduledDate: day(-70),
  completedDate: day(-68),
  description: "Stem piano",
  cost: 750_000,
  supplierId: 2,
  performedBy: null,
});
maintenance({
  assetId: MIXER.id,
  status: "SCHEDULED",
  scheduledDate: day(20),
  completedDate: null,
  description: "Catatan salah input",
  cost: null,
  supplierId: null,
  performedBy: null,
  deletedAt: stamp(day(-2)),
});

disposal({
  assetId: PIANO.id,
  method: "SOLD",
  disposalDate: addDays(monthStart(-1), 9),
  reason: "Diganti piano digital; dijual ke sekolah musik.",
  proceeds: 15_000_000,
  status: "APPROVED",
  approvedAt: stamp(addDays(monthStart(-1), 10)),
  submittedBy: 12,
});
disposal({
  assetId: LAPTOP.id,
  method: "SCRAPPED",
  disposalDate: addDays(monthStart(-5), 11),
  reason: "Motherboard rusak, biaya perbaikan melebihi harga baru.",
  proceeds: 0,
  status: "APPROVED",
  approvedAt: stamp(addDays(monthStart(-5), 12)),
  submittedBy: 12,
});
disposal({
  assetId: PRINTER.id,
  method: "LOST",
  disposalDate: day(-2),
  reason: "Tidak ditemukan sesudah renovasi aula.",
  proceeds: 0,
  status: "PENDING",
  submittedBy: 12,
});
disposal({
  assetId: SOUND.id,
  method: "DONATED",
  disposalDate: day(-20),
  reason: "Dihibahkan ke pos pelayanan.",
  proceeds: 0,
  status: "REJECTED",
  rejectionNote: "Masih dipakai kebaktian padang. Jangan dihibahkan dulu.",
  submittedBy: 11,
});

export const liveDisposalOf = (assetId: number) =>
  DISPOSAL.find(
    (row) =>
      row.assetId === assetId &&
      (row.status === "PENDING" || row.status === "APPROVED"),
  );

export type AssetStatus = "AKTIF" | "MENUNGGU_PELEPASAN" | "DILEPAS";

export const assetStatusOf = (assetId: number): AssetStatus => {
  const found = liveDisposalOf(assetId);

  return !found
    ? "AKTIF"
    : found.status === "APPROVED"
      ? "DILEPAS"
      : "MENUNGGU_PELEPASAN";
};

export const submitDisposal = (input: {
  assetId: number;
  method: DisposalMethod;
  disposalDate: string;
  reason: string;
  proceeds: number;
}) =>
  disposal({
    ...input,
    proceeds: input.method === "SOLD" ? input.proceeds : 0,
    status: "PENDING",
    submittedBy: SESSION_USER_ID,
  });

export const decideDisposal = (
  key: string,
  decision: Exclude<DisposalStatus, "PENDING">,
  note: string | null = null,
) => {
  const row = DISPOSAL.find(
    (item) => item.code === key || item.approval?.publicId === key,
  );
  if (!row || row.status !== "PENDING") return null;

  row.status = decision;
  row.rejectionNote = decision === "REJECTED" ? note : null;
  row.approvedAt = decision === "APPROVED" ? new Date().toISOString() : null;

  return row;
};

export const RUN: RunRow[] = [];

const postedEntriesOf = (assetId: number, exceptRunId?: number) =>
  RUN.filter((run) => run.status === "POSTED" && run.id !== exceptRunId)
    .flatMap((run) => run.entries)
    .filter((entry) => entry.assetId === assetId);

export const accumulatedOf = (row: AssetRow, exceptRunId?: number) =>
  round2(
    (row.openingAccumulatedDepreciation ?? 0) +
      postedEntriesOf(row.id, exceptRunId).reduce(
        (sum, entry) => sum + entry.amount,
        0,
      ),
  );

export const bookValueOf = (row: AssetRow) =>
  row.acquisitionCost === null
    ? null
    : round2(row.acquisitionCost - accumulatedOf(row));

export const lastPeriodOf = (assetId: number) => {
  const run = RUN.filter(
    (item) =>
      item.status === "POSTED" &&
      item.entries.some((entry) => entry.assetId === assetId),
  ).sort((a, b) => runIndex(b) - runIndex(a))[0];

  return run ? { year: run.year, month: run.month } : null;
};

export const hasPostedDepreciation = (assetId: number) =>
  postedEntriesOf(assetId).length > 0;

export const monthlyDepreciation = (
  cost: number,
  salvage: number,
  life: number | null,
) =>
  !life || life <= 0 || cost - salvage <= 0
    ? 0
    : round2((cost - salvage) / life);

export const applyDepreciation = (input: {
  cost: number;
  salvage: number;
  accumulated: number;
  monthly: number;
}) => {
  const remaining = input.cost - input.salvage - input.accumulated;
  const amount = round2(Math.max(Math.min(input.monthly, remaining), 0));
  const accumulatedAfter = round2(input.accumulated + amount);

  return {
    amount,
    accumulatedAfter,
    bookValueAfter: round2(input.cost - accumulatedAfter),
  };
};

const isExcludedFrom = (row: AssetRow, index: number) => {
  if (!isLive(row) || !row.isDepreciable || !row.depreciationStartDate) {
    return true;
  }
  if (periodIndex(row.depreciationStartDate) > index) return true;
  if (
    row.openingAccumulatedAsOf &&
    periodIndex(row.openingAccumulatedAsOf) >= index
  ) {
    return true;
  }

  const found = liveDisposalOf(row.id);

  return (
    found?.status === "APPROVED" && periodIndex(found.disposalDate) < index
  );
};

export const calculateRun = (run: RunRow) => {
  const index = runIndex(run);
  const entries = ASSET.filter((row) => !isExcludedFrom(row, index)).flatMap(
    (row): RunEntry[] => {
      const cost = row.acquisitionCost ?? 0;
      const salvage = row.salvageValue ?? 0;
      const charge = applyDepreciation({
        cost,
        salvage,
        accumulated: accumulatedOf(row, run.id),
        monthly: monthlyDepreciation(cost, salvage, row.usefulLifeMonths),
      });

      return charge.amount > 0
        ? [
            {
              publicId: uuid("d800", run.id * 1000 + row.id),
              assetId: row.id,
              ...charge,
            },
          ]
        : [];
    },
  );

  run.entries = entries;
  run.totalAmount = round2(
    entries.reduce((sum, entry) => sum + entry.amount, 0),
  );
  run.updatedAt = new Date().toISOString();

  return run;
};

const PERIOD_FORMAT = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const PERIOD_DAY = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const periodLabel = (year: number, month: number) =>
  PERIOD_FORMAT.format(new Date(Date.UTC(year, month - 1, 1)));

const periodOfIndex = (index: number) => ({
  year: Math.floor(index / 12),
  month: (index % 12) + 1,
});

export const nextRunPeriod = () => {
  const latest = [...RUN].sort((a, b) => runIndex(b) - runIndex(a))[0];

  return latest
    ? periodOfIndex(runIndex(latest) + 1)
    : periodOfIndex(periodIndex(TODAY));
};

export const runOpenFailure = (year: number, month: number): Failure | null => {
  if (RUN.some((run) => run.year === year && run.month === month)) {
    return { status: 409, message: "Penyusutan Untuk Periode Ini Sudah Ada" };
  }
  if (year * 12 + month - 1 > periodIndex(TODAY)) {
    return { status: 400, message: "Periode Penyusutan Belum Dimulai" };
  }

  const draft = RUN.find((run) => run.status === "DRAFT");
  const posted = RUN.filter((run) => run.status === "POSTED").sort(
    (a, b) => runIndex(b) - runIndex(a),
  )[0];
  const next = posted ? periodOfIndex(runIndex(posted) + 1) : null;
  const index = year * 12 + month - 1;
  const monthFailure = (message: string): Failure => ({
    status: 400,
    path: "month",
    message,
  });

  if (draft) {
    return monthFailure(
      `Posting Penyusutan ${periodLabel(draft.year, draft.month)} Terlebih Dahulu`,
    );
  }
  if (!next || index === runIndex(next)) return null;

  return monthFailure(
    index > runIndex(next)
      ? `Posting Penyusutan ${periodLabel(next.year, next.month)} Terlebih Dahulu`
      : `Penyusutan Berikutnya Adalah ${periodLabel(next.year, next.month)}`,
  );
};

export const openRun = (year: number, month: number) => {
  const id = nextId(RUN.map((run) => ({ id: run.id, deletedAt: null })));
  const run: RunRow = {
    id,
    publicId: uuid("d900", id),
    code: codeOf("PNY", { yearly: true }),
    year,
    month,
    status: "DRAFT",
    totalAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
    postedAt: null,
    journalCode: null,
    entries: [],
  };
  RUN.push(run);

  return run;
};

export const postRun = (run: RunRow) => {
  run.status = "POSTED";
  run.postedAt = new Date().toISOString();
  run.journalCode =
    run.entries.length > 0 ? codeOf("JRN", { yearly: true }) : null;

  return run;
};

for (const offset of [-3, -2, -1]) {
  const period = periodOfIndex(periodIndex(TODAY) + offset);
  const run = calculateRun(openRun(period.year, period.month));
  if (offset < -1) postRun(run);
}

export const runView = (run: RunRow, isDetail = false) => ({
  publicId: run.publicId,
  code: run.code,
  year: run.year,
  month: run.month,
  status: run.status,
  totalAmount: money(run.totalAmount),
  postedAt: run.postedAt,
  createdAt: run.createdAt,
  updatedAt: run.updatedAt,
  entryCount: run.entries.length,
  ...(isDetail
    ? {
        journal: run.journalCode ? { code: run.journalCode } : null,
        entries: run.entries.map((entry) => {
          const row = ASSET.find((item) => item.id === entry.assetId);

          return {
            publicId: entry.publicId,
            assetId: entry.assetId,
            amount: money(entry.amount),
            accumulatedAfter: money(entry.accumulatedAfter),
            bookValueAfter: money(entry.bookValueAfter),
            asset: row
              ? { publicId: row.publicId, code: row.code, name: row.name }
              : null,
          };
        }),
      }
    : {}),
});

const place = (
  row: { publicId: string; code: string; name: string } | undefined,
) => (row ? { publicId: row.publicId, code: row.code, name: row.name } : null);

const bapelRef = (id: number) => {
  const found = bapelOf(id);

  return found
    ? { id, publicId: `bapel-${id}`, code: found.code, name: found.name }
    : null;
};

const roomRef = (id: number) => {
  const found = roomRowOf(id);

  return found
    ? { id, publicId: found.publicId, code: found.code, name: found.name }
    : null;
};

export const disposalView = (row: DisposalRow) => {
  const target = ASSET.find((item) => item.id === row.assetId);

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    assetId: row.assetId,
    method: row.method,
    disposalDate: iso(row.disposalDate),
    reason: row.reason,
    proceeds: money(row.proceeds),
    status: row.status,
    approvedAt: row.approvedAt,
    asset: place(target),
    approval: row.approval
      ? {
          publicId: row.approval.publicId,
          code: row.approval.code,
          status: row.status,
        }
      : null,
  };
};

export const assetView = (row: AssetRow, isDetail = false) => {
  const type = TYPE_ITEM.find((item) => item.id === row.typeId);
  const bapel = bapelRef(row.bapelId);
  const room = roomRef(row.roomId);
  const found = liveDisposalOf(row.id);

  return {
    publicId: row.publicId,
    code: row.code,
    name: row.name,
    description: row.description,
    serialNumber: row.serialNumber,
    condition: row.condition,
    warrantyUntil: iso(row.warrantyUntil),
    acquisitionSource: row.acquisitionSource,
    donorName: row.donorName,
    acquisitionDate: iso(row.acquisitionDate),
    acquisitionCost: money(row.acquisitionCost),
    isDepreciable: row.isDepreciable,
    salvageValue: money(row.salvageValue),
    usefulLifeMonths: row.usefulLifeMonths,
    depreciationStartDate: iso(row.depreciationStartDate),
    openingAccumulatedDepreciation: money(row.openingAccumulatedDepreciation),
    openingAccumulatedAsOf: iso(row.openingAccumulatedAsOf),
    type: type ? { id: type.id, code: type.code, name: type.name } : null,
    bapel: bapel ? { id: bapel.id, code: bapel.code, name: bapel.name } : null,
    room: room ? { id: room.id, code: room.code, name: room.name } : null,
    mainImage: row.mainImage ? assetPhotoView(row.mainImage) : null,
    status: assetStatusOf(row.id),
    disposal: found
      ? {
          code: found.code,
          method: found.method,
          disposalDate: iso(found.disposalDate),
          status: found.status,
        }
      : null,
    ...(isDetail
      ? {
          id: row.id,
          detailImage: row.detailImage.map(assetPhotoView),
          depreciation: row.isDepreciable
            ? {
                openingAccumulated: money(row.openingAccumulatedDepreciation),
                accumulated: money(accumulatedOf(row)),
                bookValue: money(bookValueOf(row)),
                lastPeriod: lastPeriodOf(row.id),
              }
            : null,
        }
      : {}),
  };
};

export const STOCK_ITEM: StockItemRow[] = [];
export const STOCK_MOVEMENT: MovementRow[] = [];

const stockItem = (
  seed: Pick<
    StockItemRow,
    "name" | "typeId" | "bapelId" | "roomId" | "unitId"
  > &
    Partial<StockItemRow>,
) => {
  const id = STOCK_ITEM.length + 1;
  const row: StockItemRow = {
    id,
    publicId: uuid("da00", id),
    code: codeOf("BRP"),
    description: null,
    quantity: 0,
    reorderPoint: null,
    lastUnitPrice: null,
    deletedAt: null,
    ...seed,
  };
  STOCK_ITEM.push(row);

  return row;
};

export const stockItemOf = (id: number) =>
  STOCK_ITEM.find((row) => row.id === id && isLive(row));

export const nextBalance = (
  current: number,
  type: MovementType,
  quantity: number,
) => (type === "OUT" ? current - quantity : current + quantity);

const lastMovementDateOf = (stockItemId: number) =>
  STOCK_MOVEMENT.filter((row) => row.stockItemId === stockItemId)
    .map((row) => row.movementDate)
    .sort()
    .at(-1) ?? null;

export const applyMovement = (
  stockItemId: number,
  input: {
    type: MovementType;
    source: MovementSource;
    quantity: number;
    movementDate: string;
    note: string | null;
  },
): { movement: MovementRow } | { failure: Failure } => {
  const item = stockItemOf(stockItemId);
  if (!item) {
    return {
      failure: {
        status: 404,
        path: "stockItemId",
        message: "Barang Persediaan Tidak Ditemukan",
      },
    };
  }
  if (input.movementDate > TODAY) {
    return {
      failure: {
        status: 400,
        path: "movementDate",
        message: "Tanggal Mutasi Tidak Boleh Di Masa Depan",
      },
    };
  }

  const last = lastMovementDateOf(item.id);
  if (last && input.movementDate < last) {
    return {
      failure: {
        status: 400,
        path: "movementDate",
        message: `Tanggal Mutasi Tidak Boleh Sebelum ${PERIOD_DAY.format(new Date(iso(last) ?? ""))}`,
      },
    };
  }

  const balanceAfter = nextBalance(item.quantity, input.type, input.quantity);
  if (balanceAfter < 0) {
    return {
      failure: {
        status: 400,
        path: "quantity",
        message: `Stok Tidak Mencukupi. Sisa Stok ${item.name} Saat Ini ${item.quantity}`,
      },
    };
  }

  const id = STOCK_MOVEMENT.length + 1;
  const movement: MovementRow = {
    id,
    publicId: uuid("db00", id),
    stockItemId: item.id,
    ...input,
    balanceAfter,
    createdAt: new Date().toISOString(),
  };
  STOCK_MOVEMENT.push(movement);
  item.quantity = balanceAfter;

  return { movement };
};

const LILIN = stockItem({
  name: "Lilin Altar",
  typeId: TYPE.IBADAH,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  unitId: UNIT_ID.BUAH,
  reorderPoint: 20,
});
const ROTI = stockItem({
  name: "Roti Perjamuan",
  typeId: TYPE.IBADAH,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  unitId: UNIT_ID.PAK,
  reorderPoint: 5,
});
const ANGGUR = stockItem({
  name: "Anggur Perjamuan",
  typeId: TYPE.IBADAH,
  bapelId: MAJELIS,
  roomId: GEDUNG,
  unitId: UNIT_ID.BOTOL,
  reorderPoint: 4,
});
const KERTAS = stockItem({
  name: "Kertas HVS A4",
  typeId: TYPE.ATK,
  bapelId: MAJELIS,
  roomId: AULA,
  unitId: UNIT_ID.RIM,
  reorderPoint: 5,
  lastUnitPrice: 55_000,
});
const TINTA = stockItem({
  name: "Tinta Printer",
  typeId: TYPE.ATK,
  bapelId: MAJELIS,
  roomId: AULA,
  unitId: UNIT_ID.BUAH,
  reorderPoint: 2,
});
const SABUN = stockItem({
  name: "Sabun Lantai",
  typeId: TYPE.KEBERSIHAN,
  bapelId: MAJELIS,
  roomId: AULA,
  unitId: UNIT_ID.BOTOL,
});
const TISU = stockItem({
  name: "Tisu",
  typeId: TYPE.KEBERSIHAN,
  bapelId: MAJELIS,
  roomId: AULA,
  unitId: UNIT_ID.PAK,
});
const AMPLOP = stockItem({
  name: "Amplop Persembahan",
  typeId: TYPE.ATK,
  bapelId: MAJELIS,
  roomId: AULA,
  unitId: UNIT_ID.PAK,
  reorderPoint: 10,
});
const KIDUNG = stockItem({
  name: "Kidung Jemaat",
  description: "Buku nyanyian untuk jemaat tamu.",
  typeId: TYPE.IBADAH,
  bapelId: MUSIK,
  roomId: GEDUNG,
  unitId: UNIT_ID.BUAH,
  lastUnitPrice: 85_000,
});
const SPIDOL = stockItem({
  name: "Spidol Papan Tulis",
  typeId: TYPE.ATK,
  bapelId: PEMUDA,
  roomId: AULA,
  unitId: UNIT_ID.KOTAK,
});
stockItem({
  name: "Kapur Tulis",
  typeId: TYPE.ATK,
  bapelId: PEMUDA,
  roomId: AULA,
  unitId: UNIT_ID.KOTAK,
  deletedAt: stamp(day(-80)),
});

const OPNAME_POSTED_CODE = `OPN-${YEAR}-0001`;

const SEED_MOVEMENTS: [
  StockItemRow,
  number,
  MovementType,
  MovementSource,
  number,
  string | null,
][] = [
  [LILIN, -60, "IN", "OPENING_BALANCE", 40, "Stok awal"],
  [ROTI, -60, "IN", "OPENING_BALANCE", 10, "Stok awal"],
  [ANGGUR, -60, "IN", "OPENING_BALANCE", 8, "Stok awal"],
  [KERTAS, -60, "IN", "OPENING_BALANCE", 10, "Stok awal"],
  [TINTA, -60, "IN", "OPENING_BALANCE", 2, "Stok awal"],
  [SABUN, -60, "IN", "OPENING_BALANCE", 10, "Stok awal"],
  [TISU, -60, "IN", "OPENING_BALANCE", 40, "Stok awal"],
  [AMPLOP, -60, "IN", "OPENING_BALANCE", 20, "Stok awal"],
  [KIDUNG, -60, "IN", "OPENING_BALANCE", 100, "Stok awal"],
  [SPIDOL, -60, "IN", "OPENING_BALANCE", 5, "Stok awal"],
  [LILIN, -53, "OUT", "USAGE", 8, "Ibadah Minggu"],
  [ROTI, -53, "OUT", "USAGE", 2, "Perjamuan Kudus"],
  [TISU, -50, "OUT", "TRANSFER", 10, "Dipindah ke gudang lama"],
  [LILIN, -46, "OUT", "USAGE", 8, "Ibadah Minggu"],
  [KERTAS, -45, "IN", "GOODS_RECEIPT", 10, "Penerimaan PNR-2026-0004"],
  [KIDUNG, -45, "IN", "GOODS_RECEIPT", 20, "Penerimaan PNR-2026-0004"],
  [KERTAS, -44, "OUT", "PURCHASE_RETURN", 2, "Retur 2 rim basah"],
  [LILIN, -40, "IN", "GOODS_RECEIPT", 24, "Penerimaan PNR-2026-0006"],
  [ROTI, -39, "OUT", "USAGE", 2, "Perjamuan Kudus"],
  [ANGGUR, -39, "OUT", "USAGE", 2, "Perjamuan Kudus"],
  [SPIDOL, -35, "OUT", "USAGE", 5, "Kelas katekisasi"],
  [LILIN, -32, "IN", "DONATION", 20, "Dari Ibu Rina untuk ibadah Natal"],
  [TINTA, -30, "OUT", "USAGE", 1, null],
  [SABUN, -28, "OUT", "USAGE", 2, null],
  [LILIN, -25, "OUT", "USAGE", 8, "Ibadah Minggu"],
  [ROTI, -25, "OUT", "USAGE", 2, "Perjamuan Kudus"],
  [KERTAS, -20, "OUT", "USAGE", 6, "Cetak warta"],
  [
    LILIN,
    -18,
    "ADJUSTMENT",
    "STOCK_OPNAME",
    -4,
    `Stok opname ${OPNAME_POSTED_CODE}`,
  ],
  [
    AMPLOP,
    -18,
    "ADJUSTMENT",
    "STOCK_OPNAME",
    -2,
    `Stok opname ${OPNAME_POSTED_CODE}`,
  ],
  [TINTA, -15, "OUT", "DISPOSAL", 1, "Tinta kering"],
  [LILIN, -11, "OUT", "USAGE", 8, "Ibadah Minggu"],
  [ROTI, -11, "OUT", "USAGE", 1, "Perjamuan Kudus"],
  [AMPLOP, -7, "OUT", "MANUAL", 3, "Dipakai kebaktian padang"],
];

for (const [item, offset, type, source, quantity, note] of SEED_MOVEMENTS) {
  applyMovement(item.id, {
    type,
    source,
    quantity,
    movementDate: day(offset),
    note,
  });
}

export const OPNAME: OpnameRow[] = [];

const opnameLine = (
  item: StockItemRow,
  systemQuantity: number,
  physicalQuantity: number,
  note: string | null = null,
): OpnameItem => ({
  publicId: uuid("dc00", OPNAME.length * 100 + item.id),
  stockItemId: item.id,
  systemQuantity,
  physicalQuantity,
  difference: physicalQuantity - systemQuantity,
  note,
});

const opname = (seed: Omit<OpnameRow, "id" | "publicId" | "code">) => {
  const id = OPNAME.length + 1;
  OPNAME.push({
    id,
    publicId: uuid("dd00", id),
    code: codeOf("OPN", { yearly: true }),
    ...seed,
  });
};

opname({
  opnameDate: day(-18),
  status: "POSTED",
  roomId: null,
  note: "Hitung akhir bulan seluruh gereja.",
  completedById: 11,
  completedAt: stamp(day(-18)),
  postedById: 13,
  postedAt: stamp(day(-18)),
  items: [
    opnameLine(LILIN, 60, 56, "Terpakai tanpa dicatat"),
    opnameLine(AMPLOP, 20, 18, "Rusak kena air"),
    opnameLine(ROTI, 4, 4),
  ],
});
opname({
  opnameDate: day(-40),
  status: "CANCELLED",
  roomId: AULA,
  note: "Salah pilih ruang.",
  completedById: null,
  completedAt: null,
  postedById: null,
  postedAt: null,
  items: [opnameLine(SABUN, 10, 9, "Satu botol bocor")],
});
opname({
  opnameDate: day(-21),
  status: "COMPLETED",
  roomId: AULA,
  note: null,
  completedById: 13,
  completedAt: stamp(day(-21)),
  postedById: null,
  postedAt: null,
  items: [opnameLine(KERTAS, 18, 17, "Satu rim basah")],
});
opname({
  opnameDate: day(-1),
  status: "COMPLETED",
  roomId: GEDUNG,
  note: "Persiapan Perjamuan Kudus.",
  completedById: SESSION_USER_ID,
  completedAt: stamp(day(-1)),
  postedById: null,
  postedAt: null,
  items: [
    opnameLine(LILIN, 48, 46, "Patah saat dibersihkan"),
    opnameLine(ROTI, 3, 3),
    opnameLine(ANGGUR, 6, 6),
    opnameLine(KIDUNG, 120, 120),
  ],
});
opname({
  opnameDate: TODAY,
  status: "DRAFT",
  roomId: AULA,
  note: null,
  completedById: null,
  completedAt: null,
  postedById: null,
  postedAt: null,
  items: [
    opnameLine(TINTA, 0, 0),
    opnameLine(AMPLOP, 15, 14),
    opnameLine(SPIDOL, 0, 0),
  ],
});

export const opnameView = (row: OpnameRow, isDetail = false) => {
  const room = row.roomId === null ? null : place(roomRowOf(row.roomId));
  const base = {
    publicId: row.publicId,
    code: row.code,
    opnameDate: iso(row.opnameDate),
    status: row.status,
    roomId: row.roomId,
    room,
    note: row.note,
    completedAt: row.completedAt,
    postedAt: row.postedAt,
    itemCount: row.items.length,
    differenceCount: row.items.filter((item) => item.difference !== 0).length,
  };
  if (!isDetail) return base;

  return {
    ...base,
    completedBy: userNameOf(row.completedById),
    postedBy: userNameOf(row.postedById),
    isCompletedByViewer: row.completedById === SESSION_USER_ID,
    items: row.items.map((item) => {
      const stock = STOCK_ITEM.find((one) => one.id === item.stockItemId);
      const unit = stock ? UNIT.find((one) => one.id === stock.unitId) : null;

      return {
        ...item,
        stockItem: stock
          ? {
              publicId: stock.publicId,
              code: stock.code,
              name: stock.name,
              unit: unit ? { publicId: unit.publicId, name: unit.name } : null,
            }
          : null,
      };
    }),
  };
};

export const stockItemView = (row: StockItemRow) => ({
  id: row.id,
  publicId: row.publicId,
  code: row.code,
  name: row.name,
  description: row.description,
  quantity: row.quantity,
  reorderPoint: row.reorderPoint,
  lastUnitPrice: money(row.lastUnitPrice),
  typeId: row.typeId,
  bapelId: row.bapelId,
  roomId: row.roomId,
  unitId: row.unitId,
  type: place(TYPE_ITEM.find((item) => item.id === row.typeId)),
  bapel: (() => {
    const found = bapelRef(row.bapelId);

    return found
      ? { publicId: found.publicId, code: found.code, name: found.name }
      : null;
  })(),
  room: place(roomRowOf(row.roomId)),
  unit: place(UNIT.find((item) => item.id === row.unitId)),
});

export const movementView = (row: MovementRow) => {
  const stock = STOCK_ITEM.find((item) => item.id === row.stockItemId);
  const unit = stock ? UNIT.find((item) => item.id === stock.unitId) : null;
  const room = stock ? roomRowOf(stock.roomId) : undefined;

  return {
    id: row.id,
    publicId: row.publicId,
    stockItemId: row.stockItemId,
    type: row.type,
    source: row.source,
    quantity: row.quantity,
    balanceAfter: row.balanceAfter,
    movementDate: iso(row.movementDate),
    note: row.note,
    createdAt: row.createdAt,
    stockItem: stock
      ? {
          publicId: stock.publicId,
          code: stock.code,
          name: stock.name,
          unit: unit ? { publicId: unit.publicId, name: unit.name } : null,
          room: room ? { code: room.code, name: room.name } : null,
        }
      : null,
  };
};

export const maintenanceView = (row: MaintenanceRow) => {
  const supplier =
    row.supplierId === null ? undefined : supplierOf(row.supplierId);

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    assetId: row.assetId,
    status: row.status,
    scheduledDate: iso(row.scheduledDate),
    completedDate: iso(row.completedDate),
    description: row.description,
    cost: money(row.cost),
    supplierId: row.supplierId,
    performedBy: row.performedBy,
    asset: place(ASSET.find((item) => item.id === row.assetId)),
    supplier: supplier
      ? {
          publicId: `supplier-${supplier.id}`,
          code: supplier.code,
          name: supplier.name,
        }
      : null,
  };
};

export const transferView = (row: TransferRow) => {
  const bapel = (id: number) => {
    const found = bapelRef(id);

    return found
      ? { publicId: found.publicId, code: found.code, name: found.name }
      : null;
  };

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    assetId: row.assetId,
    transferDate: iso(row.transferDate),
    reason: row.reason,
    asset: place(ASSET.find((item) => item.id === row.assetId)),
    fromRoom: place(roomRowOf(row.fromRoomId)),
    toRoom: place(roomRowOf(row.toRoomId)),
    fromBapel: bapel(row.fromBapelId),
    toBapel: bapel(row.toBapelId),
  };
};

const byName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name, "id");

const matches = (filter: string, ...values: (string | null)[]) =>
  !filter ||
  values.some((value) => value?.toLowerCase().includes(filter.toLowerCase()));

export const typeItemDdl = () =>
  TYPE_ITEM.filter(isLive)
    .sort(byName)
    .map(({ id, code, name }) => ({ id, code, name }));

export const unitDdl = () =>
  UNIT.filter(isLive)
    .sort(byName)
    .map(({ id, code, name }) => ({ id, code, name }));

export const supplierDdl = () => [...SUPPLIER].sort(byName);

export const assetDdl = (params: { filter: string; limit: number | null }) => {
  const rows = ASSET.filter(
    (row) =>
      isLive(row) &&
      assetStatusOf(row.id) === "AKTIF" &&
      matches(params.filter, row.code, row.name, row.serialNumber),
  )
    .sort(byName)
    .map((row) => {
      const room = roomRowOf(row.roomId);
      const bapel = bapelOf(row.bapelId);

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        serialNumber: row.serialNumber,
        acquisitionCost: money(row.acquisitionCost),
        room: room ? { id: room.id, name: room.name } : null,
        bapel: bapel ? { id: bapel.id, name: bapel.name } : null,
      };
    });

  return params.limit === null ? rows : rows.slice(0, params.limit);
};

export const stockItemDdl = (params: {
  filter: string;
  limit: number | null;
  roomId: number | null;
}) => {
  const rows = STOCK_ITEM.filter(
    (row) =>
      isLive(row) &&
      (params.roomId === null || row.roomId === params.roomId) &&
      matches(params.filter, row.code, row.name),
  )
    .sort(byName)
    .map((row) => {
      const room = roomRowOf(row.roomId);
      const unit = UNIT.find((item) => item.id === row.unitId);

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        quantity: row.quantity,
        unit: unit ? { name: unit.name } : null,
        room: room ? { id: room.id, name: room.name } : null,
      };
    });

  return params.limit === null ? rows : rows.slice(0, params.limit);
};

export const roomHoldsInventory = (roomId: number) =>
  ASSET.some(
    (row) =>
      isLive(row) &&
      row.roomId === roomId &&
      assetStatusOf(row.id) !== "DILEPAS",
  ) || STOCK_ITEM.some((row) => isLive(row) && row.roomId === roomId);
