import {
  CalendarDays,
  Church,
  ClipboardList,
  CreditCard,
  Flag,
  House,
  Package,
  PiggyBank,
  Settings,
  ShoppingBasket,
  Stamp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Slug menu, disalin dari `be-sada/src/common/constants/menu.ts`.
 *
 * Ada di sini supaya kode FE menyebut menu lewat konstanta, bukan literal
 * string: `useMenuAccess(MENU.DAFTAR_JEMAAT)` gagal saat compile bila salah
 * ketik, sedangkan `useMenuAccess("DAFTAR_JEMAT")` gagal diam-diam dengan
 * menyembunyikan tombol yang seharusnya ada.
 *
 * Yang TIDAK ada di sini: struktur pohonnya. Pohon dan labelnya datang dari
 * API, sehingga menu yang ditambahkan be-sada muncul tanpa rilis FE.
 */
export const MENU = {
  // Domain
  KEJEMAATAN: "KEJEMAATAN",
  PELAYANAN: "PELAYANAN",
  PERIBADAHAN: "PERIBADAHAN",
  KEGIATAN: "KEGIATAN",
  FASILITAS: "FASILITAS",
  INVENTARIS: "INVENTARIS",
  PENGADAAN: "PENGADAAN",
  KEUANGAN: "KEUANGAN",
  ANGGARAN: "ANGGARAN",
  SDM: "SDM",
  PERSETUJUAN: "PERSETUJUAN",
  PENGATURAN: "PENGATURAN",

  // Kejemaatan
  DAFTAR_JEMAAT: "DAFTAR_JEMAAT",
  KELUARGA: "KELUARGA",
  PERNIKAHAN: "PERNIKAHAN",
  RIWAYAT_JEMAAT: "RIWAYAT_JEMAAT",
  ROLE_JEMAAT: "ROLE_JEMAAT",
  BAPEL: "BAPEL",
  REPORT_JEMAAT: "REPORT_JEMAAT",

  // Pelayanan
  JADWAL_PELAYAN: "JADWAL_PELAYAN",
  TEMPLATE_JADWAL: "TEMPLATE_JADWAL",
  DAFTAR_PELAYAN: "DAFTAR_PELAYAN",
  ROLE_PELAYAN: "ROLE_PELAYAN",
  SKILL_MUSIK: "SKILL_MUSIK",

  // Peribadahan
  IBADAH: "IBADAH",
  TIPE_IBADAH: "TIPE_IBADAH",

  // Kegiatan
  EVENT: "EVENT",
  PENDAFTARAN_EVENT: "PENDAFTARAN_EVENT",
  GALERI: "GALERI",
  PENGUMUMAN: "PENGUMUMAN",

  // Fasilitas
  PEMINJAMAN_RUANG: "PEMINJAMAN_RUANG",
  RUANG: "RUANG",

  // Inventaris
  BARANG: "BARANG",
  TIPE_BARANG: "TIPE_BARANG",
  SATUAN: "SATUAN",
  BARANG_PERSEDIAAN: "BARANG_PERSEDIAAN",
  MUTASI_STOK: "MUTASI_STOK",
  STOK_OPNAME: "STOK_OPNAME",
  SIKLUS_ASET: "SIKLUS_ASET",
  PENYUSUTAN: "PENYUSUTAN",

  // Pengadaan
  SUPPLIER: "SUPPLIER",
  PERMINTAAN_PEMBELIAN: "PERMINTAAN_PEMBELIAN",
  PESANAN_PEMBELIAN: "PESANAN_PEMBELIAN",
  PENERIMAAN_BARANG: "PENERIMAAN_BARANG",
  RETUR_PEMBELIAN: "RETUR_PEMBELIAN",
  FAKTUR_SUPPLIER: "FAKTUR_SUPPLIER",

  // Keuangan
  PERSEMBAHAN: "PERSEMBAHAN",
  TIPE_PERSEMBAHAN: "TIPE_PERSEMBAHAN",
  AKUN: "AKUN",
  KAS_MASUK: "KAS_MASUK",
  KAS_KELUAR: "KAS_KELUAR",
  JURNAL: "JURNAL",
  PERIODE_FISKAL: "PERIODE_FISKAL",
  LAPORAN_KEUANGAN: "LAPORAN_KEUANGAN",
  PEMBAYARAN: "PEMBAYARAN",
  MATA_UANG: "MATA_UANG",
  SETELAN_AKUNTANSI: "SETELAN_AKUNTANSI",

  // Anggaran
  PROGRAM: "PROGRAM",
  LAPORAN_BUDGET: "LAPORAN_BUDGET",
  PAGU_ANGGARAN: "PAGU_ANGGARAN",

  // SDM
  KARYAWAN: "KARYAWAN",
  CUTI: "CUTI",
  TIPE_CUTI: "TIPE_CUTI",
  KONTRAK_KARYAWAN: "KONTRAK_KARYAWAN",
  ABSENSI_KARYAWAN: "ABSENSI_KARYAWAN",
  PAYROLL: "PAYROLL",
  KOMPONEN_PAYROLL: "KOMPONEN_PAYROLL",
  PAJAK_PPH21: "PAJAK_PPH21",

  // Persetujuan
  PERMINTAAN_PERSETUJUAN: "PERMINTAAN_PERSETUJUAN",
  SETELAN_PERSETUJUAN: "SETELAN_PERSETUJUAN",

  // Pengaturan
  USER: "USER",
  ROLE_USER: "ROLE_USER",
  ACTIVITY_LOG: "ACTIVITY_LOG",
} as const;

export type MenuSlug = (typeof MENU)[keyof typeof MENU];

/**
 * Ikon per domain. Hanya 12 entri, karena hanya domain yang dirender
 * berikon — layar daun tampil sebagai baris teks di dalam sheet.
 */
export const MENU_ICON: Record<string, LucideIcon> = {
  [MENU.KEJEMAATAN]: UserPlus,
  [MENU.PELAYANAN]: CalendarDays,
  [MENU.PERIBADAHAN]: Church,
  [MENU.KEGIATAN]: Flag,
  [MENU.FASILITAS]: House,
  [MENU.INVENTARIS]: Package,
  [MENU.PENGADAAN]: ShoppingBasket,
  [MENU.KEUANGAN]: CreditCard,
  [MENU.ANGGARAN]: PiggyBank,
  [MENU.SDM]: ClipboardList,
  [MENU.PERSETUJUAN]: Stamp,
  [MENU.PENGATURAN]: Settings,
};

/**
 * Rute satu layar diturunkan dari slugnya, bukan dari tabel 61 baris.
 *
 * Tabel semacam itu harus dijaga sejalan dengan be-sada setiap kali ada menu
 * baru, dan yang terlupakan akan menghasilkan tautan ke 404. Turunan ini
 * selalu benar selama konvensi rutenya dipatuhi: `/<domain>/<layar>`, keduanya
 * kebab-case dari slug.
 */
export const menuHref = (groupSlug: string, leafSlug: string): string =>
  `/${toKebabCase(groupSlug)}/${toKebabCase(leafSlug)}`;

const toKebabCase = (slug: string): string =>
  slug.toLowerCase().replaceAll("_", "-");
