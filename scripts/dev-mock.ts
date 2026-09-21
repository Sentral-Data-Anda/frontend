/**
 * `bun run dev:mock` — review UI slicing tanpa be-sada, tanpa database, tanpa `.env`.
 *
 * Menyalakan tiruan be-sada di :3001 lalu `next dev` di :3000 yang diarahkan ke
 * sana. Login dengan username/password apa saja. Ctrl+C mematikan keduanya.
 *
 * Varian untuk menguji keadaan layar:
 *   MOCK_NO_CREATE=1 bun run dev:mock   → DAFTAR_JEMAAT hanya VIEW, tombol Tambah harus hilang
 *   MOCK_500=1 bun run dev:mock         → daftar jemaat & ibadah menjawab 500, layar galat
 *   MOCK_NO_IBADAH=1 bun run dev:mock   → tidak ada ibadah hari ini (404 be-sada)
 *
 * Port bisa digeser supaya berjalan di samping `dev:mock` lain:
 *   MOCK_API_PORT=3011 PORT=3010 bun run dev:mock
 *
 * Ini alat review, bukan kontrak. Bentuk respons yang benar tetap ditentukan
 * be-sada; kalau tiruan ini dan be-sada berselisih, be-sada yang benar.
 */
import { MENU, type MenuSlug } from "../src/config/menu";
import { toDateKey } from "../src/features/beranda/time";

const API_PORT = Number(process.env.MOCK_API_PORT ?? 3001);
const WEB_PORT = Number(process.env.PORT ?? 3000);

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

/**
 * Dua ibadah HARI INI (Asia/Jakarta, sama dengan yang diminta Beranda).
 * Bentuk baris = `ibadahRepository.findAllWithPagination` di be-sada: kolom
 * `ibadah` tanpa FK dan kolom audit, plus relasi `{ id, code, name }`.
 */
const ibadahRow = (
  id: number,
  startTime: string,
  endTime: string,
  preacher: string | null,
  typeName: string,
) => ({
  id,
  publicId: `00000000-0000-4000-8000-00000000000${id}`,
  code: `IBD-${String(id).padStart(4, "0")}`,
  date: `${toDateKey(new Date())}T00:00:00.000Z`,
  startTime,
  endTime,
  theme: null,
  bibleVerse: null,
  preacher,
  maleCount: 0,
  femaleCount: 0,
  childCount: 0,
  note: null,
  typeIbadah: { id, code: `TI-${id}`, name: typeName },
  room: null,
  bapel: null,
  jadwalPelayan: null,
});

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
  port: API_PORT,
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

    if (path === "/ibadah") {
      if (process.env.MOCK_500) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }

      const date = url.searchParams.get("date");
      // Urutan be-sada: date desc, startTime desc.
      const matched =
        process.env.MOCK_NO_IBADAH || (date && date !== toDateKey(new Date()))
          ? []
          : [
              ibadahRow(2, "17:00", "18:30", null, "Ibadah Minggu II"),
              ibadahRow(
                1,
                "08:00",
                "09:30",
                "Pdt. Yohanes Simatupang",
                "Ibadah Minggu I",
              ),
            ];

      if (matched.length === 0) {
        return json({ status: 404, error: "Data Ibadah Tidak Ditemukan" }, 404);
      }

      return json({
        status: 200,
        message: "Berhasil Mendapatkan Semua Data Ibadah",
        totalData: matched.length,
        totalPage: 1,
        data: matched,
      });
    }

    return json({ status: 404, error: "Tidak Ditemukan" }, 404);
  },
});

const next = Bun.spawn(["bunx", "next", "dev", "-p", String(WEB_PORT)], {
  stdio: ["inherit", "inherit", "inherit"],
  env: {
    ...process.env,
    API_BASE_URL: `http://localhost:${API_PORT}/api`,
    NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
  },
});

process.exit(await next.exited);

export {};
