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

import type { MenuNode } from "@/features/auth/types";

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
 * Daftar eksplisit 12 domain, sumber `generateStaticParams` halaman
 * `/[domain]`. Bukan `Object.keys(MENU_ICON)`: tabel ikon adalah urusan
 * tampilan, sedangkan daftar ini menentukan rute mana yang ada.
 */
export const DOMAIN_SLUGS = [
  MENU.KEJEMAATAN,
  MENU.PELAYANAN,
  MENU.PERIBADAHAN,
  MENU.KEGIATAN,
  MENU.FASILITAS,
  MENU.INVENTARIS,
  MENU.PENGADAAN,
  MENU.KEUANGAN,
  MENU.ANGGARAN,
  MENU.SDM,
  MENU.PERSETUJUAN,
  MENU.PENGATURAN,
] as const;

/**
 * Delapan domain "Aksi cepat" Beranda, urutan sesuai mockup
 * (`docs/design/beranda-reference.png`). Beranda memfilternya terhadap
 * `session.menu`, jadi domain yang tidak dipegang peran tetap tersembunyi;
 * sisanya lewat "Tampilkan semua".
 */
export const BERANDA_SHORTCUTS: readonly MenuSlug[] = [
  MENU.KEJEMAATAN,
  MENU.PELAYANAN,
  MENU.KEGIATAN,
  MENU.FASILITAS,
  MENU.INVENTARIS,
  MENU.PENGADAAN,
  MENU.KEUANGAN,
  MENU.SDM,
];

/**
 * Penjelasan satu baris di bawah nama layar pada halaman domain. Teks dari
 * `docs/design/menu-descriptions.md` (Business Analyst), disalin apa adanya.
 * Opsional per slug: layar tanpa entri hanya menampilkan judul.
 */
export const MENU_DESCRIPTION: Partial<Record<MenuSlug, string>> = {
  [MENU.DAFTAR_JEMAAT]: "Catat dan cari data anggota jemaat",
  [MENU.KELUARGA]: "Kelola kartu keluarga dan anggotanya",
  [MENU.PERNIKAHAN]: "Catat pernikahan dan perubahannya",
  [MENU.RIWAYAT_JEMAAT]: "Baptis, sidi, atestasi, dan kedukaan",
  [MENU.ROLE_JEMAAT]: "Jabatan jemaat di komisi dan masanya",
  [MENU.BAPEL]: "Kelola komisi dan aturan jadwalnya",
  [MENU.REPORT_JEMAAT]: "Statistik jemaat dan ulang tahun",
  [MENU.JADWAL_PELAYAN]: "Atur siapa melayani di tiap ibadah",
  [MENU.TEMPLATE_JADWAL]: "Pola jadwal siap pakai per komisi",
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
  [MENU.BARANG]: "Data aset tetap milik gereja",
  [MENU.TIPE_BARANG]: "Kategori untuk mengelompokkan barang",
  [MENU.SATUAN]: "Satuan ukur, mis. buah atau lusin",
  [MENU.BARANG_PERSEDIAAN]: "Barang habis pakai dan jumlah stoknya",
  [MENU.MUTASI_STOK]: "Catat barang masuk dan keluar gudang",
  [MENU.STOK_OPNAME]: "Hitung fisik dan cocokkan stok",
  [MENU.SIKLUS_ASET]: "Servis, pindah lokasi, dan lepas aset",
  [MENU.PENYUSUTAN]: "Hitung penurunan nilai aset bulanan",
  [MENU.SUPPLIER]: "Data pemasok barang dan jasa",
  [MENU.PERMINTAAN_PEMBELIAN]: "Ajukan kebutuhan barang untuk disetujui",
  [MENU.PESANAN_PEMBELIAN]: "Pesan barang ke pemasok",
  [MENU.PENERIMAAN_BARANG]: "Catat barang yang tiba dari pemasok",
  [MENU.RETUR_PEMBELIAN]: "Kembalikan barang yang tidak sesuai",
  [MENU.FAKTUR_SUPPLIER]: "Catat tagihan pemasok dan pelunasannya",
  [MENU.PERSEMBAHAN]: "Catat persembahan yang diterima",
  [MENU.TIPE_PERSEMBAHAN]: "Jenis persembahan, mis. kolekte",
  [MENU.AKUN]: "Daftar pos pembukuan gereja",
  [MENU.KAS_MASUK]: "Catat penerimaan di luar persembahan",
  [MENU.KAS_KELUAR]: "Ajukan dan catat pengeluaran uang",
  [MENU.JURNAL]: "Catatan pembukuan debit dan kredit",
  [MENU.PERIODE_FISKAL]: "Buka dan tutup buku tiap bulan",
  [MENU.LAPORAN_KEUANGAN]: "Neraca, surplus/defisit, buku besar",
  [MENU.PEMBAYARAN]: "Pantau pembayaran online jemaat",
  [MENU.MATA_UANG]: "Kurs untuk pembelian dari luar negeri",
  [MENU.SETELAN_AKUNTANSI]: "Akun untuk pencatatan otomatis",
  [MENU.PROGRAM]: "Usulan program kerja komisi",
  [MENU.LAPORAN_BUDGET]: "Laporan pemakaian dana komisi bulanan",
  [MENU.PAGU_ANGGARAN]: "Batas anggaran tahunan tiap komisi",
  [MENU.KARYAWAN]: "Data pegawai kantor gereja",
  [MENU.CUTI]: "Ajukan cuti dan lihat sisa jatah",
  [MENU.TIPE_CUTI]: "Jenis cuti dan jatah per tahun",
  [MENU.KONTRAK_KARYAWAN]: "Masa kerja dan gaji pokok pegawai",
  [MENU.ABSENSI_KARYAWAN]: "Kehadiran harian pegawai",
  [MENU.PAYROLL]: "Hitung dan ajukan gaji bulanan",
  [MENU.KOMPONEN_PAYROLL]: "Tunjangan dan potongan gaji",
  [MENU.PAJAK_PPH21]: "Tarif potongan pajak gaji per tahun",
  [MENU.PERMINTAAN_PERSETUJUAN]: "Dokumen yang menunggu tanda tangan",
  [MENU.SETELAN_PERSETUJUAN]: "Tentukan siapa menyetujui dokumen",
  [MENU.USER]: "Kelola akun login pengguna",
  [MENU.ROLE_USER]: "Atur hak akses tiap peran",
  [MENU.ACTIVITY_LOG]: "Riwayat perubahan data oleh pengguna",
};

/** Ikon per domain: tile Beranda, `/modul`, sidebar, fallback ikon layar. */
export const MENU_ICON: Record<string, LucideIcon> = {
  [MENU.KEJEMAATAN]: Users,
  [MENU.PELAYANAN]: HandHeart,
  [MENU.PERIBADAHAN]: Church,
  [MENU.KEGIATAN]: CalendarHeart,
  [MENU.FASILITAS]: Landmark,
  [MENU.INVENTARIS]: Package,
  [MENU.PENGADAAN]: ShoppingBag,
  [MENU.KEUANGAN]: Wallet,
  [MENU.ANGGARAN]: ChartPie,
  [MENU.SDM]: Contact,
  [MENU.PERSETUJUAN]: FileCheck,
  [MENU.PENGATURAN]: Settings,
};

/**
 * Ikon per layar untuk tile di halaman domain. Dalam satu domain tidak ada dua
 * layar berikon sama (dijaga `menu.test.ts`); antar domain boleh sama bila
 * maknanya sama — semua layar "Tipe …" memakai `Shapes`.
 */
export const MENU_LEAF_ICON: Partial<Record<MenuSlug, LucideIcon>> = {
  [MENU.DAFTAR_JEMAAT]: Users,
  [MENU.KELUARGA]: House,
  [MENU.PERNIKAHAN]: HeartHandshake,
  [MENU.RIWAYAT_JEMAAT]: History,
  [MENU.ROLE_JEMAAT]: BadgeCheck,
  [MENU.BAPEL]: Network,
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

  [MENU.BARANG]: Armchair,
  [MENU.TIPE_BARANG]: Shapes,
  [MENU.SATUAN]: Ruler,
  [MENU.BARANG_PERSEDIAAN]: PackageOpen,
  [MENU.MUTASI_STOK]: ArrowLeftRight,
  [MENU.STOK_OPNAME]: ClipboardCheck,
  [MENU.SIKLUS_ASET]: RefreshCw,
  [MENU.PENYUSUTAN]: TrendingDown,

  [MENU.SUPPLIER]: Truck,
  [MENU.PERMINTAAN_PEMBELIAN]: FilePlus,
  [MENU.PESANAN_PEMBELIAN]: ShoppingCart,
  [MENU.PENERIMAAN_BARANG]: PackageCheck,
  [MENU.RETUR_PEMBELIAN]: Undo2,
  [MENU.FAKTUR_SUPPLIER]: ReceiptText,

  [MENU.PERSEMBAHAN]: HandCoins,
  [MENU.TIPE_PERSEMBAHAN]: Shapes,
  [MENU.AKUN]: ListTree,
  [MENU.KAS_MASUK]: ArrowDownToLine,
  [MENU.KAS_KELUAR]: ArrowUpFromLine,
  [MENU.JURNAL]: NotebookPen,
  [MENU.PERIODE_FISKAL]: CalendarCog,
  [MENU.LAPORAN_KEUANGAN]: FileChartColumn,
  [MENU.PEMBAYARAN]: CreditCard,
  [MENU.MATA_UANG]: Coins,
  [MENU.SETELAN_AKUNTANSI]: SlidersHorizontal,

  [MENU.PROGRAM]: Lightbulb,
  [MENU.LAPORAN_BUDGET]: ChartColumn,
  [MENU.PAGU_ANGGARAN]: Gauge,

  [MENU.KARYAWAN]: Briefcase,
  [MENU.CUTI]: Plane,
  [MENU.TIPE_CUTI]: Shapes,
  [MENU.KONTRAK_KARYAWAN]: FilePen,
  [MENU.ABSENSI_KARYAWAN]: UserCheck,
  [MENU.PAYROLL]: Banknote,
  [MENU.KOMPONEN_PAYROLL]: Calculator,
  [MENU.PAJAK_PPH21]: Percent,

  [MENU.PERMINTAAN_PERSETUJUAN]: Inbox,
  [MENU.SETELAN_PERSETUJUAN]: Workflow,

  [MENU.USER]: UserCog,
  [MENU.ROLE_USER]: ShieldCheck,
  [MENU.ACTIVITY_LOG]: Activity,
};

/**
 * Ikon satu layar; slug yang belum dipetakan (menu baru dari be-sada) memakai
 * ikon domainnya, bukan kotak kosong.
 */
export const leafIcon = (
  leafSlug: string,
  domainSlug: string,
): LucideIcon | undefined =>
  MENU_LEAF_ICON[leafSlug as MenuSlug] ?? MENU_ICON[domainSlug];

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

/** Halaman domain, `/<domain>`. */
export const domainHref = (domainSlug: string): string =>
  `/${toKebabCase(domainSlug)}`;

/**
 * Tujuan tile domain di Beranda dan `/modul`. Domain yang hanya memberi satu
 * layar langsung ke layar itu — halaman berisi satu kartu cuma menambah satu
 * ketukan.
 */
export const domainEntryHref = (domain: MenuNode): string =>
  domain.children.length === 1
    ? menuHref(domain.slug, domain.children[0].slug)
    : domainHref(domain.slug);

const toKebabCase = (slug: string): string =>
  slug.toLowerCase().replaceAll("_", "-");
