import {
  Activity,
  Armchair,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BadgeCheck,
  Banknote,
  BookOpen,
  Briefcase,
  Calculator,
  CalendarCheck,
  CalendarClock,
  CalendarCog,
  CalendarHeart,
  CalendarOff,
  CalendarPlus,
  ChartColumn,
  ChartPie,
  Church,
  ClipboardCheck,
  Coins,
  Contact,
  CreditCard,
  DoorOpen,
  FileChartColumn,
  FileCheck,
  FilePen,
  FilePlus,
  Gauge,
  HandCoins,
  HandHeart,
  HeartHandshake,
  History,
  House,
  IdCard,
  Images,
  Inbox,
  Landmark,
  LayoutTemplate,
  Lightbulb,
  ListTree,
  Megaphone,
  Music,
  MapPinned,
  Network,
  NotebookPen,
  Package,
  PackageCheck,
  PackageOpen,
  Percent,
  Plane,
  ReceiptText,
  RefreshCw,
  Ruler,
  Settings,
  Shapes,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Ticket,
  TrendingDown,
  Truck,
  Undo2,
  UserCheck,
  UserCog,
  Users,
  Wallet,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import type { MenuNode } from "@/types/menu";

export const MENU = {
  KEJEMAATAN: "KEJEMAATAN",
  PELAYANAN: "PELAYANAN",
  PERIBADAHAN: "PERIBADAHAN",
  KEGIATAN: "KEGIATAN",
  FASILITAS: "FASILITAS",
  INVENTORY: "INVENTORY",
  FIXED_ASSET: "FIXED_ASSET",
  PROCUREMENT: "PROCUREMENT",
  FINANCE: "FINANCE",
  BUDGETING: "BUDGETING",
  HR: "HR",
  APPROVAL: "APPROVAL",
  SETTINGS: "SETTINGS",
  REPORT: "REPORT",

  DAFTAR_JEMAAT: "DAFTAR_JEMAAT",
  KELUARGA: "KELUARGA",
  PERNIKAHAN: "PERNIKAHAN",
  RIWAYAT_JEMAAT: "RIWAYAT_JEMAAT",
  ROLE_JEMAAT: "ROLE_JEMAAT",
  BAPEL: "BAPEL",
  WILAYAH: "WILAYAH",

  JADWAL_PELAYAN: "JADWAL_PELAYAN",
  TEMPLATE_JADWAL: "TEMPLATE_JADWAL",
  DAFTAR_PELAYAN: "DAFTAR_PELAYAN",
  ROLE_PELAYAN: "ROLE_PELAYAN",
  SKILL_MUSIK: "SKILL_MUSIK",

  IBADAH: "IBADAH",
  TIPE_IBADAH: "TIPE_IBADAH",

  EVENT: "EVENT",
  PENDAFTARAN_EVENT: "PENDAFTARAN_EVENT",
  GALERI: "GALERI",
  PENGUMUMAN: "PENGUMUMAN",

  PEMINJAMAN_RUANG: "PEMINJAMAN_RUANG",
  RUANG: "RUANG",

  ITEM_CATEGORY: "ITEM_CATEGORY",
  SATUAN: "SATUAN",
  STOCK_ITEM: "STOCK_ITEM",
  STOCK_MOVEMENT: "STOCK_MOVEMENT",
  STOK_OPNAME: "STOK_OPNAME",

  ASSET_MASTER: "ASSET_MASTER",
  ASSET_TRANSACTION: "ASSET_TRANSACTION",
  DEPRECIATION: "DEPRECIATION",

  SUPPLIER: "SUPPLIER",
  PURCHASE_REQUEST: "PURCHASE_REQUEST",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  GOODS_RECEIPT: "GOODS_RECEIPT",
  PURCHASE_RETURN: "PURCHASE_RETURN",
  SUPPLIER_INVOICE: "SUPPLIER_INVOICE",

  PERSEMBAHAN: "PERSEMBAHAN",
  TIPE_PERSEMBAHAN: "TIPE_PERSEMBAHAN",
  CHART_OF_ACCOUNT: "CHART_OF_ACCOUNT",
  KAS_MASUK: "KAS_MASUK",
  KAS_KELUAR: "KAS_KELUAR",
  BANK_DEPOSIT: "BANK_DEPOSIT",
  JOURNAL_ENTRY: "JOURNAL_ENTRY",
  FISCAL_PERIOD: "FISCAL_PERIOD",
  PAYMENT: "PAYMENT",
  CURRENCY: "CURRENCY",
  ACCOUNTING_SETTING: "ACCOUNTING_SETTING",

  PROGRAM: "PROGRAM",
  BUDGET: "BUDGET",

  EMPLOYEE: "EMPLOYEE",
  LEAVE: "LEAVE",
  LEAVE_TYPE: "LEAVE_TYPE",
  EMPLOYEE_CONTRACT: "EMPLOYEE_CONTRACT",
  ATTENDANCE: "ATTENDANCE",
  PAYROLL: "PAYROLL",
  PAYROLL_COMPONENT: "PAYROLL_COMPONENT",
  PAJAK_PPH21: "PAJAK_PPH21",

  APPROVAL_REQUEST: "APPROVAL_REQUEST",
  APPROVAL_WORKFLOW: "APPROVAL_WORKFLOW",

  USER: "USER",
  USER_ROLE: "USER_ROLE",
  ACTIVITY_LOG: "ACTIVITY_LOG",
  HOLIDAY: "HOLIDAY",

  REPORT_JEMAAT: "REPORT_JEMAAT",
  FINANCIAL_STATEMENT: "FINANCIAL_STATEMENT",
  BUDGET_REALIZATION: "BUDGET_REALIZATION",
} as const;

export type MenuSlug = (typeof MENU)[keyof typeof MENU];

export const DOMAIN_SLUGS = [
  MENU.KEJEMAATAN,
  MENU.PELAYANAN,
  MENU.PERIBADAHAN,
  MENU.KEGIATAN,
  MENU.FASILITAS,
  MENU.INVENTORY,
  MENU.FIXED_ASSET,
  MENU.PROCUREMENT,
  MENU.FINANCE,
  MENU.BUDGETING,
  MENU.HR,
  MENU.REPORT,
  MENU.APPROVAL,
  MENU.SETTINGS,
] as const;

export const BERANDA_SHORTCUTS: readonly MenuSlug[] = [
  MENU.KEJEMAATAN,
  MENU.PELAYANAN,
  MENU.KEGIATAN,
  MENU.FASILITAS,
  MENU.INVENTORY,
  MENU.PROCUREMENT,
  MENU.FINANCE,
  MENU.HR,
];

export const MENU_DESCRIPTION: Partial<Record<MenuSlug, string>> = {
  [MENU.DAFTAR_JEMAAT]: "Catat dan cari data anggota jemaat",
  [MENU.KELUARGA]: "Kelola kartu keluarga dan anggotanya",
  [MENU.PERNIKAHAN]: "Catat pernikahan dan perubahannya",
  [MENU.RIWAYAT_JEMAAT]: "Baptis, sidi, atestasi, dan kedukaan",
  [MENU.ROLE_JEMAAT]: "Jabatan jemaat di badan pelayanan dan masanya",
  [MENU.BAPEL]: "Kelola badan pelayanan dan aturan jadwalnya",
  [MENU.WILAYAH]: "Kelola wilayah pelayanan jemaat",
  [MENU.REPORT_JEMAAT]: "Statistik jemaat dan ulang tahun",
  [MENU.JADWAL_PELAYAN]: "Atur siapa melayani di tiap ibadah",
  [MENU.TEMPLATE_JADWAL]: "Pola jadwal siap pakai per badan pelayanan",
  [MENU.DAFTAR_PELAYAN]: "Jemaat yang terlibat dalam pelayanan",
  [MENU.ROLE_PELAYAN]: "Jenis tugas pelayan dalam ibadah",
  [MENU.SKILL_MUSIK]: "Keahlian musik yang dimiliki pelayan",
  [MENU.IBADAH]: "Catat ibadah, tema, dan jumlah hadir",
  [MENU.TIPE_IBADAH]: "Jenis-jenis ibadah yang diadakan",
  [MENU.EVENT]: "Buat dan umumkan kegiatan gereja",
  [MENU.PENDAFTARAN_EVENT]: "Daftarkan peserta ke kegiatan",
  [MENU.GALERI]: "Album foto kegiatan gereja",
  [MENU.PENGUMUMAN]: "Buat warta untuk aplikasi dan website",
  [MENU.PEMINJAMAN_RUANG]: "Pesan ruangan untuk kegiatan",
  [MENU.RUANG]: "Data ruangan yang bisa dipinjam",
  [MENU.ASSET_MASTER]: "Data aset tetap milik gereja",
  [MENU.ITEM_CATEGORY]: "Kategori untuk mengelompokkan barang",
  [MENU.SATUAN]: "Satuan ukur, mis. buah atau lusin",
  [MENU.STOCK_ITEM]: "Barang habis pakai dan jumlah stoknya",
  [MENU.STOCK_MOVEMENT]: "Catat barang masuk dan keluar gudang",
  [MENU.STOK_OPNAME]: "Hitung fisik dan cocokkan stok",
  [MENU.ASSET_TRANSACTION]: "Servis, pindah lokasi, dan lepas aset",
  [MENU.DEPRECIATION]: "Hitung penurunan nilai aset bulanan",
  [MENU.SUPPLIER]: "Data pemasok barang dan jasa",
  [MENU.PURCHASE_REQUEST]: "Ajukan kebutuhan barang untuk disetujui",
  [MENU.PURCHASE_ORDER]: "Pesan barang ke pemasok",
  [MENU.GOODS_RECEIPT]: "Catat barang yang tiba dari pemasok",
  [MENU.PURCHASE_RETURN]: "Kembalikan barang yang tidak sesuai",
  [MENU.SUPPLIER_INVOICE]: "Catat tagihan pemasok dan pelunasannya",
  [MENU.PERSEMBAHAN]: "Catat persembahan yang diterima",
  [MENU.TIPE_PERSEMBAHAN]: "Jenis persembahan, mis. kolekte",
  [MENU.CHART_OF_ACCOUNT]: "Daftar pos pembukuan gereja",
  [MENU.KAS_MASUK]: "Catat penerimaan di luar persembahan",
  [MENU.KAS_KELUAR]: "Ajukan dan catat pengeluaran uang",
  [MENU.BANK_DEPOSIT]: "Pindahkan uang antar kas dan bank",
  [MENU.JOURNAL_ENTRY]: "Catatan pembukuan debit dan kredit",
  [MENU.FISCAL_PERIOD]: "Buka dan tutup buku tiap bulan",
  [MENU.FINANCIAL_STATEMENT]: "Neraca, surplus/defisit, buku besar",
  [MENU.PAYMENT]: "Pantau pembayaran online jemaat",
  [MENU.CURRENCY]: "Kurs untuk pembelian dari luar negeri",
  [MENU.ACCOUNTING_SETTING]: "Akun untuk pencatatan otomatis",
  [MENU.PROGRAM]: "Usulan program kerja badan pelayanan",
  [MENU.BUDGET_REALIZATION]: "Laporan pemakaian dana badan pelayanan bulanan",
  [MENU.BUDGET]: "Batas anggaran tahunan tiap badan pelayanan",
  [MENU.EMPLOYEE]: "Data pegawai kantor gereja",
  [MENU.LEAVE]: "Ajukan cuti dan lihat sisa jatah",
  [MENU.LEAVE_TYPE]: "Jenis cuti dan jatah per tahun",
  [MENU.EMPLOYEE_CONTRACT]: "Masa kerja dan gaji pokok pegawai",
  [MENU.ATTENDANCE]: "Kehadiran harian pegawai",
  [MENU.PAYROLL]: "Hitung dan ajukan gaji bulanan",
  [MENU.PAYROLL_COMPONENT]: "Tunjangan dan potongan gaji",
  [MENU.PAJAK_PPH21]: "Tarif potongan pajak gaji per tahun",
  [MENU.APPROVAL_REQUEST]: "Dokumen yang menunggu tanda tangan",
  [MENU.APPROVAL_WORKFLOW]: "Tentukan siapa menyetujui dokumen",
  [MENU.USER]: "Kelola akun login pengguna",
  [MENU.USER_ROLE]: "Atur hak akses tiap peran",
  [MENU.ACTIVITY_LOG]: "Riwayat perubahan data; sebaiknya khusus admin",
  [MENU.HOLIDAY]: "Libur nasional dan hari khusus gereja",
};

export const MENU_ICON: Record<string, LucideIcon> = {
  [MENU.KEJEMAATAN]: Users,
  [MENU.PELAYANAN]: HandHeart,
  [MENU.PERIBADAHAN]: Church,
  [MENU.KEGIATAN]: CalendarHeart,
  [MENU.FASILITAS]: Landmark,
  [MENU.INVENTORY]: Package,
  [MENU.FIXED_ASSET]: Armchair,
  [MENU.PROCUREMENT]: ShoppingBag,
  [MENU.FINANCE]: Wallet,
  [MENU.BUDGETING]: ChartPie,
  [MENU.HR]: Contact,
  [MENU.REPORT]: FileChartColumn,
  [MENU.APPROVAL]: FileCheck,
  [MENU.SETTINGS]: Settings,
};

export const MENU_LEAF_ICON: Partial<Record<MenuSlug, LucideIcon>> = {
  [MENU.DAFTAR_JEMAAT]: Users,
  [MENU.KELUARGA]: House,
  [MENU.PERNIKAHAN]: HeartHandshake,
  [MENU.RIWAYAT_JEMAAT]: History,
  [MENU.ROLE_JEMAAT]: BadgeCheck,
  [MENU.BAPEL]: Network,
  [MENU.WILAYAH]: MapPinned,
  [MENU.REPORT_JEMAAT]: ChartPie,

  [MENU.JADWAL_PELAYAN]: CalendarCheck,
  [MENU.TEMPLATE_JADWAL]: LayoutTemplate,
  [MENU.DAFTAR_PELAYAN]: HandHeart,
  [MENU.ROLE_PELAYAN]: IdCard,
  [MENU.SKILL_MUSIK]: Music,

  [MENU.IBADAH]: BookOpen,
  [MENU.TIPE_IBADAH]: Shapes,

  [MENU.EVENT]: CalendarPlus,
  [MENU.PENDAFTARAN_EVENT]: Ticket,
  [MENU.GALERI]: Images,
  [MENU.PENGUMUMAN]: Megaphone,

  [MENU.PEMINJAMAN_RUANG]: CalendarClock,
  [MENU.RUANG]: DoorOpen,

  [MENU.ASSET_MASTER]: Armchair,
  [MENU.ITEM_CATEGORY]: Shapes,
  [MENU.SATUAN]: Ruler,
  [MENU.STOCK_ITEM]: PackageOpen,
  [MENU.STOCK_MOVEMENT]: ArrowLeftRight,
  [MENU.STOK_OPNAME]: ClipboardCheck,
  [MENU.ASSET_TRANSACTION]: RefreshCw,
  [MENU.DEPRECIATION]: TrendingDown,

  [MENU.SUPPLIER]: Truck,
  [MENU.PURCHASE_REQUEST]: FilePlus,
  [MENU.PURCHASE_ORDER]: ShoppingCart,
  [MENU.GOODS_RECEIPT]: PackageCheck,
  [MENU.PURCHASE_RETURN]: Undo2,
  [MENU.SUPPLIER_INVOICE]: ReceiptText,

  [MENU.PERSEMBAHAN]: HandCoins,
  [MENU.TIPE_PERSEMBAHAN]: Shapes,
  [MENU.CHART_OF_ACCOUNT]: ListTree,
  [MENU.KAS_MASUK]: ArrowDownToLine,
  [MENU.KAS_KELUAR]: ArrowUpFromLine,
  [MENU.BANK_DEPOSIT]: ArrowLeftRight,
  [MENU.JOURNAL_ENTRY]: NotebookPen,
  [MENU.FISCAL_PERIOD]: CalendarCog,
  [MENU.FINANCIAL_STATEMENT]: FileChartColumn,
  [MENU.PAYMENT]: CreditCard,
  [MENU.CURRENCY]: Coins,
  [MENU.ACCOUNTING_SETTING]: SlidersHorizontal,

  [MENU.PROGRAM]: Lightbulb,
  [MENU.BUDGET_REALIZATION]: ChartColumn,
  [MENU.BUDGET]: Gauge,

  [MENU.EMPLOYEE]: Briefcase,
  [MENU.LEAVE]: Plane,
  [MENU.LEAVE_TYPE]: Shapes,
  [MENU.EMPLOYEE_CONTRACT]: FilePen,
  [MENU.ATTENDANCE]: UserCheck,
  [MENU.PAYROLL]: Banknote,
  [MENU.PAYROLL_COMPONENT]: Calculator,
  [MENU.PAJAK_PPH21]: Percent,

  [MENU.APPROVAL_REQUEST]: Inbox,
  [MENU.APPROVAL_WORKFLOW]: Workflow,

  [MENU.USER]: UserCog,
  [MENU.USER_ROLE]: ShieldCheck,
  [MENU.ACTIVITY_LOG]: Activity,
  [MENU.HOLIDAY]: CalendarOff,
};

export const leafIcon = (
  leafSlug: string,
  domainSlug: string,
): LucideIcon | undefined =>
  MENU_LEAF_ICON[leafSlug as MenuSlug] ?? MENU_ICON[domainSlug];

export const menuHref = (groupSlug: string, leafSlug: string): string =>
  `/${toKebabCase(groupSlug)}/${toKebabCase(leafSlug)}`;

export const createHref = (groupSlug: string, leafSlug: string): string =>
  `${menuHref(groupSlug, leafSlug)}/${FORM_SEGMENT.create}`;

export const editHref = (
  groupSlug: string,
  leafSlug: string,
  code: string,
): string =>
  `${menuHref(groupSlug, leafSlug)}/${encodeURIComponent(code)}/${FORM_SEGMENT.edit}`;

export const detailHref = (
  groupSlug: string,
  leafSlug: string,
  code: string,
): string => `${menuHref(groupSlug, leafSlug)}/${encodeURIComponent(code)}`;

export const endHref = (
  groupSlug: string,
  leafSlug: string,
  code: string,
): string =>
  `${menuHref(groupSlug, leafSlug)}/${encodeURIComponent(code)}/${FORM_SEGMENT.end}`;

export const rejectHref = (
  groupSlug: string,
  leafSlug: string,
  code: string,
): string =>
  `${menuHref(groupSlug, leafSlug)}/${encodeURIComponent(code)}/${FORM_SEGMENT.reject}`;

export const FORM_SEGMENT = {
  create: "baru",
  edit: "ubah",
  end: "akhiri",
  reject: "tolak",
  rotation: "giliran",
  kolekte: "kolekte",
  label: "label",
} as const;

const FORM_SEGMENTS: readonly string[] = Object.values(FORM_SEGMENT);

// Layar posting batch: `posting-persembahan`, `posting-pembayaran`. Awalan,
// bukan daftar, supaya batch berikutnya tidak perlu diingat.
const FORM_PREFIXES: readonly string[] = ["posting-"];

export const ACCOUNT_HREF = "/akun";

export const ACCOUNT_PASSWORD_HREF = `${ACCOUNT_HREF}/password/${FORM_SEGMENT.edit}`;

export function isFormRoute(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1);

  // ≥ 3 segmen: layar be-sada `/<domain>/<layar>` yang kebetulan ber-slug `baru` bukan form.
  if (segments.length < 3 || last === undefined) return false;

  return (
    FORM_SEGMENTS.includes(last) ||
    FORM_PREFIXES.some((prefix) => last.startsWith(prefix))
  );
}

export const domainHref = (domainSlug: string): string =>
  `/${toKebabCase(domainSlug)}`;

export const domainEntryHref = (domain: MenuNode): string =>
  domain.children.length === 1
    ? menuHref(domain.slug, domain.children[0].slug)
    : domainHref(domain.slug);

const toKebabCase = (slug: string): string =>
  slug.toLowerCase().replaceAll("_", "-");
