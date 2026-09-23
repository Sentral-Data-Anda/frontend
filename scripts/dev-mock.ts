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
 *   MOCK_SINGLE_LEAF=1 bun run dev:mock → Peribadahan hanya IBADAH (tile & /peribadahan
 *                                         langsung ke layarnya), Pengaturan tidak dipegang
 *                                         (/pengaturan harus 404)
 *   MOCK_MANY_JEMAAT=1 bun run dev:mock → 60 jemaat (6 halaman): infinite scroll mobile
 *                                         dan elipsis pager desktop (dengan ?limit=5)
 *   MOCK_FAIL_PAGE=3 bun run dev:mock   → halaman 3 daftar jemaat menjawab 500 —
 *                                         baris "Gagal memuat — Coba lagi" di mobile
 *   MOCK_API_ONLY=1 bun run dev:mock    → hanya tiruan API, tanpa `next dev` (untuk
 *                                         `next start` hasil build di port lain)
 *   MOCK_PERSONA=bendahara bun run dev:mock → Beranda per izin; persona:
 *                                         admin (bawaan, pohon menu lengkap) |
 *                                         sekretariat | bendahara | majelis.
 *                                         Lihat `scripts/mock-dashboard.ts`.
 *   MOCK_MAJELIS_NO_FINANCE=1           → majelis tanpa LAPORAN_KEUANGAN
 *   MOCK_NO_APPROVAL=1                  → antrean persetujuan kosong
 *   MOCK_DELAY_MS=3000 bun run dev:mock → semua jawaban ditunda 3 detik (layar tunggu)
 *   MOCK_EMPTY=1 bun run dev:mock       → SEMUA daftar kosong (404 ala be-sada):
 *                                         keadaan kosong tiap layar dan tiap widget
 *   MOCK_SAVE_ERROR=phone|induk|email|kepala|validasi|500
 *                                       → simpan jemaat gagal dengan jawaban itu
 *
 * Port bisa digeser supaya berjalan di samping `dev:mock` lain:
 *   MOCK_API_PORT=3011 PORT=3010 bun run dev:mock
 *
 * Ini alat review, bukan kontrak. Bentuk respons yang benar tetap ditentukan
 * be-sada; kalau tiruan ini dan be-sada berselisih, be-sada yang benar.
 */
import { MENU, type MenuSlug } from "../src/config/menu";

import { NAME, TREE } from "./menu-tree";
import {
  PERSONAS,
  actionsOf,
  guardSlugOf,
  listBirthdays,
  listCashExpense,
  listFiscalPeriods,
  listInvoices,
  listJournals,
  listPayments,
  listPayrolls,
  jemaatTypeGender,
  listEvent,
  listIbadah,
  listLoanRoom,
  listMyOfferings,
  listPublicAnnouncements,
  listWaitingApprovals,
  neraca,
  surplusDefisit,
} from "./mock-dashboard";

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

const SURNAMES = ["Sitanggang", "Kusuma", "Wijaya", "Manurung", "Panggabean"];

// 12 nama × 5 marga. `NAMES` apa adanya tetap bawaan: layar yang sudah
// di-review dengan 12 jemaat tidak berubah diam-diam.
const names = process.env.MOCK_MANY_JEMAAT
  ? SURNAMES.flatMap((surname) =>
      NAMES.map((name) => `${name.split(" ")[0]} ${surname}`),
    )
  : NAMES;

const rows = names.map((name, index) => ({
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

if (process.env.MOCK_SINGLE_LEAF) {
  TREE[MENU.PERIBADAHAN] = [MENU.IBADAH];
  delete TREE[MENU.PENGATURAN];
}

const PERSONA_KEY = process.env.MOCK_PERSONA ?? "admin";
const persona = PERSONAS[PERSONA_KEY];

if (!persona) {
  throw new Error(
    `MOCK_PERSONA tidak dikenal: "${PERSONA_KEY}". Pilih: ${Object.keys(PERSONAS).join(", ")}.`,
  );
}

/**
 * Seperti `menuService.findTree` be-sada: layar tampil bila peran memegang
 * aksinya, domain tampil bila punya anak.
 */
const menu = Object.entries(TREE).flatMap(([domain, leaves], domainIndex) => {
  const children = leaves.flatMap((leaf, leafIndex) => {
    const action = actionsOf(persona, leaf);
    return action.length
      ? [
          {
            publicId: leaf,
            slug: leaf,
            name: NAME[leaf],
            order: leafIndex + 1,
            action,
            children: [],
          },
        ]
      : [];
  });

  return children.length
    ? [
        {
          publicId: domain,
          slug: domain,
          name: NAME[domain as MenuSlug],
          order: domainIndex + 1,
          action: [],
          children,
        },
      ]
    : [];
});

const session = {
  code: "U-0001",
  username: "A-0184",
  status: "ACTIVE",
  roleUser: { name: persona.roleName, isAdmin: persona.isAdmin },
  jemaat: { name: persona.jemaatName },
  menu,
};

const canView = (slug: string) => actionsOf(persona, slug).includes("VIEW");

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

/** `parsePagination` be-sada: bawaan 10, maks 100, nilai buruk → bawaan. */
const paging = (url: URL) => {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("limit")) || 10),
  );
  return { page, limit };
};

/**
 * Daftar berpaginasi gaya be-sada: `{ status, message, totalData, totalPage,
 * data }`, dan 404 `"<X> Tidak Ditemukan"` bila kosong.
 */
const list = (
  rows: unknown[],
  url: URL,
  okName: string,
  emptyName: string,
  message = `Berhasil Mendapatkan Semua ${okName}`,
) => {
  // `MOCK_EMPTY=1` mengosongkan SEMUA daftar sekaligus, supaya keadaan kosong
  // bisa dibuktikan lewat render — bukan hanya lewat unit test.
  if (rows.length === 0 || process.env.MOCK_EMPTY) {
    return json({ status: 404, error: `${emptyName} Tidak Ditemukan` }, 404);
  }
  const { page, limit } = paging(url);
  return json({
    status: 200,
    message,
    totalData: rows.length,
    totalPage: Math.ceil(rows.length / limit),
    data: rows.slice((page - 1) * limit, page * limit),
  });
};

/**
 * Jawaban galat untuk simpan, dipilih lewat `MOCK_SAVE_ERROR`:
 *
 *   phone   → 400 "No Handphone Sudah Tersedia" (harus mendarat di field telepon)
 *   induk   → 400 "Kode Induk Sudah Tersedia"
 *   kepala  → 500 kepala keluarga ganda (harus mendarat di field peran)
 *   validasi→ 400 pesan validasi yang TIDAK dikenal (harus jadi galat form)
 *   500     → 500 kesalahan server
 */
const SAVE_ERROR: Record<string, [number, string]> = {
  phone: [400, "No Handphone Sudah Tersedia"],
  induk: [400, "Kode Induk Sudah Tersedia"],
  email: [400, "Email Sudah Tersedia"],
  kepala: [
    500,
    'duplicate key value violates unique constraint "keluarga_member_one_head"',
  ],
  validasi: [400, "Nama Minimal 3 Karakter"],
  "500": [500, "Kesalahan server."],
};

const saveFailure = () => {
  const failure = SAVE_ERROR[process.env.MOCK_SAVE_ERROR ?? ""];

  return failure
    ? json({ status: failure[0], error: failure[1] }, failure[0])
    : null;
};

/** `MOCK_DELAY_MS=3000` — menunda SEMUA jawaban, untuk menguji layar tunggu. */
const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 0);

Bun.serve({
  port: API_PORT,
  async fetch(request) {
    if (DELAY_MS > 0) await Bun.sleep(DELAY_MS);

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

    /**
     * Simpan jemaat. Jawaban galatnya bisa dipilih lewat `MOCK_SAVE_ERROR`,
     * karena tiga jalur galat di form (galat field, galat form, galat server)
     * tidak bisa dinilai dengan mata tanpa cara memunculkannya.
     */
    if (path === "/jemaat" && request.method === "POST") {
      const failure = saveFailure();
      if (failure) return failure;

      return json(
        {
          status: 201,
          message: "Berhasil Membuat Data Jemaat",
          data: { ...(await request.json()), code: "JMT-9001" },
        },
        201,
      );
    }

    if (path === "/jemaat") {
      if (process.env.MOCK_500) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }

      const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
      const status = url.searchParams.get("status") ?? "";
      const page = Number(url.searchParams.get("page") ?? 1);
      const limit = Number(url.searchParams.get("limit") ?? 10);

      if (page === Number(process.env.MOCK_FAIL_PAGE)) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }

      const matched = rows.filter(
        (row) =>
          (!filter ||
            row.name.toLowerCase().includes(filter) ||
            row.code.toLowerCase().includes(filter)) &&
          (!status || row.status === status),
      );

      // Kontrak be-sada: daftar kosong dijawab 404, bukan 200 dengan array kosong.
      if (matched.length === 0 || process.env.MOCK_EMPTY) {
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

    // Guard be-sada `Authorization(MENU.X, "VIEW")`; admin melewatinya.
    const guard = guardSlugOf(path);
    if (guard && !canView(guard)) {
      return json(
        { status: 403, error: "Access denied: You do not have permission" },
        403,
      );
    }

    if (path === "/ibadah") {
      if (process.env.MOCK_500) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }
      return list(
        listIbadah(url.searchParams),
        url,
        "Data Ibadah",
        "Data Ibadah",
      );
    }

    if (path === "/event") {
      // Pesan sukses be-sada memang salin-tempel: "…Semua Barang".
      return list(listEvent(url.searchParams), url, "Barang", "Event");
    }

    if (
      path === "/persetujuan" &&
      url.searchParams.get("menunggu") === "saya"
    ) {
      return list(
        listWaitingApprovals(),
        url,
        "",
        "Permintaan Persetujuan",
        "Berhasil Mendapatkan Permintaan Persetujuan",
      );
    }

    if (path === "/kas-keluar") {
      return list(
        listCashExpense(url.searchParams),
        url,
        "Kas Keluar",
        "Kas Keluar",
      );
    }

    if (path === "/faktur-supplier") {
      return list(
        listInvoices(url.searchParams),
        url,
        "",
        "Faktur Supplier",
        "Berhasil Mendapatkan Faktur Supplier",
      );
    }

    if (path === "/pembayaran") {
      return list(
        listPayments(url.searchParams),
        url,
        "",
        "Pembayaran",
        "Berhasil Mendapatkan Pembayaran",
      );
    }

    if (path === "/payroll") {
      return list(
        listPayrolls(url.searchParams),
        url,
        "",
        "Penggajian",
        "Berhasil Mendapatkan Penggajian",
      );
    }

    if (path === "/periode-fiskal") {
      return list(
        listFiscalPeriods(url.searchParams),
        url,
        "Periode Fiskal",
        "Periode Fiskal",
      );
    }

    if (path === "/jurnal") {
      return list(listJournals(url.searchParams), url, "Jurnal", "Jurnal");
    }

    // Tanpa paginasi; 200 [] bila kosong.
    if (path === "/report/jemaat/type-gender") {
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Report",
        data: jemaatTypeGender(),
      });
    }

    if (path === "/loan-room") {
      return list(
        listLoanRoom(url.searchParams),
        url,
        "Pemakaian Ruangan",
        "Pemakaian Ruangan",
      );
    }

    // 200 `[]` bila kosong — tidak ada 404 di endpoint "saya".
    if (path === "/persembahan/saya") {
      const all = listMyOfferings(url.searchParams, persona.jemaatName);
      const { page, limit } = paging(url);
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Riwayat Persembahan Anda",
        totalData: all.length,
        totalPage: Math.ceil(all.length / limit),
        data: all.slice((page - 1) * limit, page * limit),
      });
    }

    // Tanpa sesi, hanya `limit`, tanpa totalData/totalPage.
    if (path === "/public/announcement") {
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Pengumuman",
        data: listPublicAnnouncements(paging(url).limit),
      });
    }

    if (path === "/laporan-keuangan/neraca") {
      const date = url.searchParams.get("date");
      if (!date) {
        return json(
          { status: 400, error: "Mohon Lengkapi Tanggal Laporan" },
          400,
        );
      }
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Neraca",
        data: neraca(date),
      });
    }

    if (path === "/laporan-keuangan/surplus-defisit") {
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      if (!from || !to) {
        return json(
          { status: 400, error: "Mohon Lengkapi Tanggal Mulai Dan Selesai" },
          400,
        );
      }
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Laporan Surplus Defisit",
        data: surplusDefisit(from, to),
      });
    }

    const birth = path.match(/^\/report\/jemaat\/birth\/([^/]+)$/);
    if (birth) {
      const data = listBirthdays(Number(birth[1]));
      if (data.length === 0) {
        return json({ status: 404, error: "Report Tidak Ditemukan" }, 404);
      }
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Report",
        data,
      });
    }

    return json({ status: 404, error: "Tidak Ditemukan" }, 404);
  },
});

// Tanpa `next dev`, `Bun.serve` di atas yang menahan proses tetap hidup.
if (!process.env.MOCK_API_ONLY) {
  const next = Bun.spawn(["bunx", "next", "dev", "-p", String(WEB_PORT)], {
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      API_BASE_URL: `http://localhost:${API_PORT}/api`,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
    },
  });

  process.exit(await next.exited);
}

export {};
