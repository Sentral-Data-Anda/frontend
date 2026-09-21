/**
 * `bun run dev:mock` — review UI slicing tanpa be-sada, tanpa database, tanpa `.env`.
 *
 * Menyalakan tiruan be-sada di :3001 lalu `next dev` di :3000 yang diarahkan ke
 * sana. Login dengan username/password apa saja. Ctrl+C mematikan keduanya.
 *
 * Varian untuk menguji keadaan layar:
 *   MOCK_NO_CREATE=1 bun run dev:mock   → DAFTAR_JEMAAT hanya VIEW, tombol Tambah harus hilang
 *   MOCK_500=1 bun run dev:mock         → daftar jemaat menjawab 500, layar galat
 *
 * Ini alat review, bukan kontrak. Bentuk respons yang benar tetap ditentukan
 * be-sada; kalau tiruan ini dan be-sada berselisih, be-sada yang benar.
 */
import { MENU, type MenuSlug } from "../src/config/menu";

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

const rows = NAMES.map((name, index) => ({
  code: `JMT-${String(index + 1).padStart(4, "0")}`,
  name,
  gender: index % 2 === 0 ? "L" : "P",
  birthDate: `199${index % 10}-0${(index % 9) + 1}-09T00:00:00.000Z`,
  type: index % 5 === 0 ? "SIMPATISAN" : "ANGGOTA",
  roleInFamily: index % 3 === 0 ? "KEPALA_KELUARGA" : "ANAK",
  keluarga:
    index % 4 === 0
      ? null
      : {
          id: index,
          code: `KEL-${index}`,
          name: `Keluarga ${name.split(" ")[1]}`,
        },
  status: index % 7 === 0 ? "TIDAK_AKTIF" : "AKTIF",
}));

/**
 * Pohon menu lengkap (12 domain, 61 layar) supaya sidebar desktop bisa dinilai
 * utuh. Slug diambil dari `src/config/menu.ts`, bukan disalin sebagai string;
 * pengelompokan domain → layar hanya ada di sini karena menu.ts sengaja tidak
 * menyimpan pohonnya (pohon milik be-sada).
 */
const TREE: Record<string, MenuSlug[]> = {
  [MENU.KEJEMAATAN]: [
    MENU.DAFTAR_JEMAAT,
    MENU.KELUARGA,
    MENU.PERNIKAHAN,
    MENU.RIWAYAT_JEMAAT,
    MENU.ROLE_JEMAAT,
    MENU.BAPEL,
    MENU.REPORT_JEMAAT,
  ],
  [MENU.PELAYANAN]: [
    MENU.JADWAL_PELAYAN,
    MENU.TEMPLATE_JADWAL,
    MENU.DAFTAR_PELAYAN,
    MENU.ROLE_PELAYAN,
    MENU.SKILL_MUSIK,
  ],
  [MENU.PERIBADAHAN]: [MENU.IBADAH, MENU.TIPE_IBADAH],
  [MENU.KEGIATAN]: [
    MENU.EVENT,
    MENU.PENDAFTARAN_EVENT,
    MENU.GALERI,
    MENU.PENGUMUMAN,
  ],
  [MENU.FASILITAS]: [MENU.PEMINJAMAN_RUANG, MENU.RUANG],
  [MENU.INVENTARIS]: [
    MENU.BARANG,
    MENU.TIPE_BARANG,
    MENU.SATUAN,
    MENU.BARANG_PERSEDIAAN,
    MENU.MUTASI_STOK,
    MENU.STOK_OPNAME,
    MENU.SIKLUS_ASET,
    MENU.PENYUSUTAN,
  ],
  [MENU.PENGADAAN]: [
    MENU.SUPPLIER,
    MENU.PERMINTAAN_PEMBELIAN,
    MENU.PESANAN_PEMBELIAN,
    MENU.PENERIMAAN_BARANG,
    MENU.RETUR_PEMBELIAN,
    MENU.FAKTUR_SUPPLIER,
  ],
  [MENU.KEUANGAN]: [
    MENU.PERSEMBAHAN,
    MENU.TIPE_PERSEMBAHAN,
    MENU.AKUN,
    MENU.KAS_MASUK,
    MENU.KAS_KELUAR,
    MENU.JURNAL,
    MENU.PERIODE_FISKAL,
    MENU.LAPORAN_KEUANGAN,
    MENU.PEMBAYARAN,
    MENU.MATA_UANG,
    MENU.SETELAN_AKUNTANSI,
  ],
  [MENU.ANGGARAN]: [MENU.PROGRAM, MENU.LAPORAN_BUDGET, MENU.PAGU_ANGGARAN],
  [MENU.SDM]: [
    MENU.KARYAWAN,
    MENU.CUTI,
    MENU.TIPE_CUTI,
    MENU.KONTRAK_KARYAWAN,
    MENU.ABSENSI_KARYAWAN,
    MENU.PAYROLL,
    MENU.KOMPONEN_PAYROLL,
    MENU.PAJAK_PPH21,
  ],
  [MENU.PERSETUJUAN]: [MENU.PERMINTAAN_PERSETUJUAN, MENU.SETELAN_PERSETUJUAN],
  [MENU.PENGATURAN]: [MENU.USER, MENU.ROLE_USER, MENU.ACTIVITY_LOG],
};

/** "DAFTAR_JEMAAT" → "Daftar Jemaat". Cukup untuk review; label asli dari be-sada. */
const toLabel = (slug: string) =>
  slug
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const leafActions = (slug: string) =>
  slug === MENU.DAFTAR_JEMAAT && !process.env.MOCK_NO_CREATE
    ? ["VIEW", "CREATE"]
    : ["VIEW"];

const session = {
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: "Sekretariat", isAdmin: false },
  jemaat: { name: "Andreas Sitanggang" },
  menu: Object.entries(TREE).map(([domain, leaves], domainIndex) => ({
    publicId: domain,
    slug: domain,
    name: toLabel(domain),
    order: domainIndex + 1,
    action: [],
    children: leaves.map((leaf, leafIndex) => ({
      publicId: leaf,
      slug: leaf,
      name: toLabel(leaf),
      order: leafIndex + 1,
      action: leafActions(leaf),
      children: [],
    })),
  })),
};

const COOKIES = ["accessToken", "refreshToken"];
const setCookies = (value: string, maxAge: number) =>
  COOKIES.map(
    (name) =>
      `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
  );

const json = (body: unknown, status = 200, cookies: string[] = []) => {
  const headers = new Headers({ "content-type": "application/json" });
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(body), { status, headers });
};

Bun.serve({
  port: 3001,
  fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/auth/login") {
      return json(
        { status: 200, message: "Berhasil Login", data: session },
        200,
        setCookies("mock", 60 * 60 * 24),
      );
    }
    if (path === "/auth/logout") {
      return json(
        { status: 200, message: "Berhasil Logout" },
        200,
        setCookies("", 0),
      );
    }
    if (path === "/auth/refresh-token") {
      return json(
        { status: 200, message: "Berhasil", data: null },
        200,
        setCookies("mock", 60 * 60 * 24),
      );
    }
    if (path.startsWith("/auth/")) {
      return json({ status: 200, message: "Berhasil", data: session });
    }

    if (path === "/jemaat") {
      if (process.env.MOCK_500) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }

      const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
      const status = url.searchParams.get("status") ?? "";
      const page = Number(url.searchParams.get("page") ?? 1);
      const limit = Number(url.searchParams.get("limit") ?? 10);

      const matched = rows.filter(
        (row) =>
          (!filter ||
            row.name.toLowerCase().includes(filter) ||
            row.code.toLowerCase().includes(filter)) &&
          (!status || row.status === status),
      );

      // Kontrak be-sada: daftar kosong dijawab 404, bukan 200 dengan array kosong.
      if (matched.length === 0) {
        return json({ status: 404, error: "Jemaat Tidak Ditemukan" }, 404);
      }

      return json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Jemaat",
        totalData: matched.length,
        totalPage: Math.ceil(matched.length / limit),
        data: matched.slice((page - 1) * limit, page * limit),
      });
    }

    return json({ status: 404, error: "Tidak Ditemukan" }, 404);
  },
});

const next = Bun.spawn(["bunx", "next", "dev"], {
  stdio: ["inherit", "inherit", "inherit"],
  env: {
    ...process.env,
    API_BASE_URL: "http://localhost:3001/api",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  },
});

process.exit(await next.exited);

export {};
