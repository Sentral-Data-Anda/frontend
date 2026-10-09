/**
 * `bun run dev:mock` — review UI slicing tanpa be-sada, tanpa database, tanpa `.env`.
 *
 * Menyalakan tiruan be-sada di :3001 lalu `next dev` di :3000 yang diarahkan ke
 * sana. Login dengan username/password apa saja. Ctrl+C mematikan keduanya.
 *
 * Varian untuk menguji keadaan layar:
 *   MOCK_NO_CREATE=1 bun run dev:mock   → DAFTAR_JEMAAT tanpa CREATE, tombol "+" harus hilang
 *   MOCK_NO_UPDATE=1 bun run dev:mock   → DAFTAR_JEMAAT tanpa UPDATE, aksi "Ubah" harus hilang
 *                                         (keduanya hanya berlaku untuk persona non-admin)
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
 *                                         sekretariat | bendahara | majelis | operator |
 *                                         koordinator | panitia.
 *                                         Lihat `scripts/mock-dashboard.ts`.
 *   MOCK_MAJELIS_NO_FINANCE=1           → majelis tanpa FINANCIAL_STATEMENT
 *   MOCK_DELAY_MS=3000 bun run dev:mock → semua jawaban ditunda 3 detik (layar tunggu)
 *   MOCK_EMPTY=1 bun run dev:mock       → SEMUA daftar kosong (404 ala be-sada):
 *                                         keadaan kosong tiap layar dan tiap widget
 *   MOCK_SAVE_ERROR=induk|email|kepala|validasi|500
 *                                       → simpan jemaat gagal dengan jawaban itu
 *                                         (validasi = issues[] per field)
 *   Simpan Anggota tanpa wilayah: lolos bila keluarganya berwilayah. Keluarga ber-id
 *   kelipatan 5 (mis. "Keluarga Panggabean 5") tidak berwilayah → 400 zoneChurchId.
 *   MOCK_OFFERINGS=empty|500            → /persembahan/saya kosong atau galat (halaman Akun)
 *   Konfirmasi password persembahan (/akun): password benar "Sada1234" (atau
 *   MOCK_STEPUP_PASSWORD); berlaku 5 menit per sesi, lalu /persembahan/saya 403
 *   STEP_UP_REQUIRED. Salah 5 kali → 429 selama 1 menit.
 *   MOCK_STEPUP_EXPIRE_MS=20000         → masa berlaku konfirmasi dipendekkan
 *   Ganti password (/akun): password lama "salah" → 400 dari be-sada.
 *   MOCK_NO_JEMAAT=1                    → akun tanpa data jemaat (sesi jemaat: null)
 *   MOCK_PENDING=1                      → akun PENDING: /authentication menampilkan form
 *                                         login pertama (PUT /auth/update/:code)
 *   MOCK_DDL_EMPTY=1                    → semua daftar pilihan form kosong (404)
 *   MOCK_DDL_MANY=1                     → daftar keluarga 400 baris (combobox panjang)
 *   MOCK_MEDIA_EXPIRED=1                → semua gambar/lampiran Kegiatan 403 (tautan kedaluwarsa)
 *
 *   MOCK_NO_DELETE=1                    → sub menu Kejemaatan (selain Daftar Jemaat) tanpa
 *                                         DELETE untuk persona sekretariat
 *   MOCK_PENYUSUTAN_NO_SETTING=1        → posting penyusutan ditolak: akun Setelan Akuntansi
 *   MOCK_PENYUSUTAN_PERIOD_CLOSED=1     → posting penyusutan ditolak: periode fiskal
 *   MOCK_DISPOSAL_NO_WORKFLOW=1         → ajukan pelepasan barang ditolak: belum ada alur
 *                                         persetujuan (dibaca handler Siklus Aset)
 *   MOCK_PR_NO_WORKFLOW=1               → ajukan permintaan pembelian ditolak: belum ada alur
 *                                         persetujuan (dibaca `submitPurchaseRequest`)
 *   MOCK_RECEIPT_RACE=1                 → catat penerimaan barang ditolak: jumlah melebihi
 *                                         pesanan (dibaca `receiveGoods`)
 *
 * Tiruan tiap sub menu Kejemaatan tinggal di `scripts/mock/handlers/<sub-menu>.ts`,
 * didaftarkan di `scripts/mock/handlers/index.ts`, dan dipanggil sebelum handler
 * bawaan di bawah. Flag MOCK_* milik sub menu ditulis di kepala berkasnya sendiri.
 *
 * Port bisa digeser supaya berjalan di samping `dev:mock` lain:
 *   MOCK_API_PORT=3011 PORT=3010 bun run dev:mock
 *
 * Bawaannya hanya terjangkau dari mesin ini. Untuk mereview di HP sungguhan:
 *   MOCK_HOST=0.0.0.0 bun run dev:mock
 * lalu buka http://<IP-laptop>:3000 dari HP yang satu wifi.
 *
 * Ini alat review, bukan kontrak. Bentuk respons yang benar tetap ditentukan
 * be-sada; kalau tiruan ini dan be-sada berselisih, be-sada yang benar.
 */
import { MENU, type MenuSlug } from "../src/config/menu";

import { NAME, TREE } from "./menu-tree";
import { MOCK_HANDLERS } from "./mock/handlers";
import { json, list, paging, readBody, type MockAction } from "./mock/kit";
import {
  PERSONA_KEY,
  PERSONA_POSITIONS,
  actionsOf,
  currentPersona,
  ddlRows,
  ZONE_CHURCHES,
  guardSlugOf,
  listBirthdays,
  listCashExpense,
  listInvoices,
  listPayments,
  jemaatTypeGender,
  listMyOfferings,
  neraca,
  surplusDefisit,
} from "./mock-dashboard";

const API_PORT = Number(process.env.MOCK_API_PORT ?? 3001);
const WEB_PORT = Number(process.env.PORT ?? 3000);

/**
 * Bawaannya `localhost`: tiruan ini tidak punya autentikasi sungguhan, jadi ia
 * tidak boleh terbuka ke jaringan hanya karena kebetulan dijalankan di kafe.
 *
 * Tapi mereview layar di HP SUNGGUHAN butuh ia terjangkau dari jaringan lokal,
 * dan itu alur kerja yang nyata di proyek ini — bukan kasus karangan. Jadi
 * pilihannya dikembalikan, bukan dicabut:
 *
 *   MOCK_HOST=0.0.0.0 bun run dev:mock
 *
 * lalu buka `http://<IP-laptop>:3000` dari HP yang satu wifi.
 */
const HOST = process.env.MOCK_HOST ?? "localhost";

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

type JemaatRow = {
  code: string;
  name: string;
  gender: string;
  birthDate: string | null;
  type: string;
  roleInFamily: string | null;
  keluarga: { id: number; code: string; name: string } | null;
  status: string;
  zoneChurch: { id: number; name: string } | null;
};

/**
 * Wilayah pribadi jemaat — sama dengan `zoneChurchId` di detail (hanya
 * Anggota), dan wilayah keluarganya. Daftar mengirim wilayah EFEKTIF
 * (be-sada B15, `8238471`): `COALESCE(keluarga.zoneChurchId,
 * jemaat.zoneChurchId)`, jadi jemaat berkeluarga bisa tampil dengan wilayah
 * yang berbeda dari field Wilayah di formnya.
 */
const personalZoneOf = (index: number, type: string) =>
  type === "ANGGOTA" ? (index % 4) + 1 : null;
const keluargaZoneOf = (keluargaId: number) =>
  keluargaId % 5 === 0 ? null : ((keluargaId + 2) % 4) + 1;
const zoneOf = (id: number | null) =>
  id === null ? null : { id, name: ZONE_CHURCHES[id - 1] ?? `Wilayah ${id}` };

const rows: JemaatRow[] = names.map((name, index) => ({
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
  zoneChurch: zoneOf(
    index % 4 === 0
      ? personalZoneOf(index + 1, index % 5 === 0 ? "SIMPATISAN" : "ANGGOTA")
      : (keluargaZoneOf(index) ??
          personalZoneOf(index, index % 5 === 0 ? "SIMPATISAN" : "ANGGOTA")),
  ),
}));

/**
 * Detail jemaat: baris daftar + field yang hanya ada di endpoint detail.
 * Dibuat deterministik dari indeks kodenya, supaya membuka jemaat yang sama
 * dua kali selalu menampilkan isi yang sama.
 */
const jemaatDetail = (row: (typeof rows)[number]) => {
  const index = Number(row.code.slice(4));
  const isAnggota = row.type === "ANGGOTA";

  return {
    code: row.code,
    name: row.name,
    gender: row.gender,
    birthPlace: ["Bandung", "Medan", "Jakarta", "Ambon"][index % 4],
    // Tiap jemaat kelima tidak punya tanggal lahir: "tidak diketahui"
    // disimpan KOSONG, dan form ubah harus menampilkannya apa adanya.
    birthDate: index % 5 === 0 ? null : row.birthDate,
    email: index % 3 === 0 ? null : `jemaat${index}@example.org`,
    phone: index % 4 === 0 ? null : `08123456${String(index).padStart(4, "0")}`,
    bloodType: isAnggota ? ["A", "B", "AB", "O"][index % 4] : null,
    lastEducation:
      index % 5 === 0 ? null : ["SMA", "S1", "SMP", "D3"][index % 4],
    statusMarital: isAnggota ? ["SM", "BM", "CM", "CH"][index % 4] : null,
    professionId: index % 5 === 0 ? null : (index % 12) + 1,
    ethnicGroupId: isAnggota ? (index % 8) + 1 : null,
    zoneChurchId: personalZoneOf(index, row.type),
    codeInduk: isAnggota ? `A-${String(index).padStart(4, "0")}` : null,
    provincesCode: "32",
    regenciesCode: "3273",
    districtsCode: "327301",
    villagesCode: "3273011001",
    address: `Jl. Merdeka No. ${index}, RT 0${(index % 9) + 1} RW 02`,
    typeJemaat: row.type,
    statusJemaat: row.status,
    keluargaId: row.keluarga?.id ?? null,
    roleInFamily: row.keluarga ? row.roleInFamily : null,
    keluargaAsalId: null,
    joinedAt: `201${index % 10}-03-01T00:00:00.000Z`,
    additional:
      index % 3 === 0
        ? []
        : [
            {
              type: "BAPTIS",
              date: `199${index % 10}-08-01T00:00:00.000Z`,
              certificateNumber: `B/${index}/199${index % 10}`,
              place: "GKI Graha Raya",
            },
            {
              type: "SIDI",
              date: `200${index % 10}-04-16T00:00:00.000Z`,
              certificateNumber: null,
              place: null,
            },
          ],
  };
};

if (process.env.MOCK_SINGLE_LEAF) {
  TREE[MENU.PERIBADAHAN] = [MENU.IBADAH];
  delete TREE[MENU.SETTINGS];
}

const persona = currentPersona();

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
  status: process.env.MOCK_PENDING ? "PENDING" : "ACTIVE",
  roleUser: { name: persona.roleName, isAdmin: persona.isAdmin },
  jemaat: process.env.MOCK_NO_JEMAAT
    ? null
    : {
        code: "JMT-0012",
        name: persona.jemaatName,
        gender: "L",
        birthPlace: "Medan",
        birthDate: "1985-05-12T00:00:00.000Z",
        phone: "081234560184",
        email: `${persona.jemaatName
          .toLowerCase()
          .replace(/[^a-z]+/g, ".")
          .replace(/^\.|\.$/g, "")}@contoh.id`,
        statusMarital: "SM",
        address: "Jl. Merdeka No. 2, RT 03 RW 02",
        villages: { name: "Cijerah" },
        districts: { name: "Bandung Kulon" },
        regencies: { name: "Kota Bandung" },
        provinces: { name: "Jawa Barat" },
        zoneChurch: { name: "Wilayah II" },
        typeJemaat: "ANGGOTA",
        statusJemaat: "AKTIF",
        joinedAt: "2012-06-17T00:00:00.000Z",
        roleJemaat: (PERSONA_POSITIONS[PERSONA_KEY] ?? []).map(
          ({ name, bapel }) => ({ name, bapel }),
        ),
      },
  menu,
};

const canView = (slug: string) => actionsOf(persona, slug).includes("VIEW");

const COOKIES = ["accessToken", "refreshToken"];
const setCookies = (value: string, maxAge: number) =>
  COOKIES.map(
    (name) =>
      `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`,
  );

/**
 * Jawaban galat untuk simpan, dipilih lewat `MOCK_SAVE_ERROR`. Tiga jalur
 * galat di form tidak bisa dinilai dengan mata tanpa cara memunculkannya:
 *
 *   validasi → 400 dengan `issues[]` — HARUS mendarat di fieldnya masing-masing
 *   induk    → 400 "Kode Induk Sudah Tersedia" (pesan unik, mendarat di kode induk)
 *   email    → 400 "Email Sudah Tersedia"
 *   kepala   → 500 kepala keluarga ganda (mendarat di field peran)
 *   500      → 500 kesalahan server (galat tingkat form, isian tidak hilang)
 */
type SaveError = {
  status: number;
  error: string;
  issues?: { path: string; message: string }[];
};

const SAVE_ERROR: Record<string, SaveError> = {
  induk: { status: 400, error: "Kode Induk Sudah Tersedia" },
  email: { status: 400, error: "Email Sudah Tersedia" },
  kepala: {
    status: 500,
    error:
      'duplicate key value violates unique constraint "keluarga_member_one_head"',
  },
  // Bentuk galat validasi sejak 2026-09-23: `issues[]` ber-`path` bertitik,
  // yang langsung bisa dipakai `setError(path)` di FE.
  validasi: {
    status: 400,
    error: "Data Tidak Valid",
    issues: [
      { path: "name", message: "Nama minimal 3 karakter menurut server" },
      { path: "birthPlace", message: "Tempat lahir tidak dikenali server" },
    ],
  },
  "500": { status: 500, error: "Kesalahan server." },
};

const saveFailure = () => {
  const failure = SAVE_ERROR[process.env.MOCK_SAVE_ERROR ?? ""];

  return failure ? json(failure, failure.status) : null;
};

type JemaatBody = {
  name: string;
  gender: string;
  birthDate: string | null;
  typeJemaat: string;
  statusJemaat: string;
  roleInFamily: string | null;
  zoneChurchId: number | null;
  keluargaId?: number | null;
};

const zoneIssue = (error: string, message: string) =>
  json(
    { status: 400, error, issues: [{ path: "zoneChurchId", message }] },
    400,
  );

// Aturan wilayah be-sada (wilayah-keluarga.md): Anggota tanpa wilayah pribadi
// lolos bila keluarga yang dipakai berwilayah.
const zoneFailure = (body: JemaatBody, keluargaId: number | null) => {
  if (body.zoneChurchId) {
    return ZONE_CHURCHES[body.zoneChurchId - 1]
      ? null
      : zoneIssue("Wilayah Tidak Ditemukan", "Wilayah tidak ditemukan.");
  }
  if (body.typeJemaat !== "ANGGOTA") return null;
  if (!keluargaId) {
    return zoneIssue(
      "Wilayah Wajib Diisi",
      "Wilayah wajib diisi untuk Anggota yang belum masuk keluarga.",
    );
  }
  if (keluargaZoneOf(keluargaId) === null) {
    return zoneIssue(
      "Wilayah Wajib Diisi",
      "Keluarga ini belum punya wilayah. Isi wilayah jemaat atau lengkapi wilayah keluarganya.",
    );
  }
  return null;
};

/** `MOCK_DELAY_MS=3000` — menunda SEMUA jawaban, untuk menguji layar tunggu. */
const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 0);

// Satu sesi mock (cookie "mock" sama untuk semua), jadi satu keadaan global.
const STEPUP_PASSWORD = process.env.MOCK_STEPUP_PASSWORD ?? "Sada1234";
const STEPUP_EXPIRE_MS = Number(process.env.MOCK_STEPUP_EXPIRE_MS ?? 300_000);
const STEPUP_MAX_FAILURES = 5;
const STEPUP_LOCK_MS = 60_000;
const stepUp = { expiresAt: 0, failures: 0, lockedUntil: 0 };

const resetStepUp = () => Object.assign(stepUp, { expiresAt: 0, failures: 0 });

const passwordIssue = (message: string) =>
  json(
    {
      status: 400,
      error: message,
      issues: [{ path: "password", message }],
    },
    400,
  );

const verifyPassword = async (request: Request) => {
  if (Date.now() < stepUp.lockedUntil) {
    return json(
      {
        status: 429,
        error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
      },
      429,
    );
  }

  const { password } = (await request.json()) as { password?: unknown };

  if (typeof password !== "string" || password === "") {
    return passwordIssue("Mohon lengkapi password");
  }
  if (password.length > 25) {
    return passwordIssue("Password maksimal 25 karakter");
  }
  if (password !== STEPUP_PASSWORD) {
    stepUp.failures += 1;
    if (stepUp.failures >= STEPUP_MAX_FAILURES) {
      stepUp.failures = 0;
      stepUp.lockedUntil = Date.now() + STEPUP_LOCK_MS;
    }
    return passwordIssue("Password tidak sesuai. Periksa kembali.");
  }

  stepUp.expiresAt = Date.now() + STEPUP_EXPIRE_MS;

  return json({
    status: 200,
    message: "Berhasil Memverifikasi Password",
    data: { expiresAt: new Date(stepUp.expiresAt).toISOString() },
  });
};

Bun.serve({
  hostname: HOST,
  port: API_PORT,
  async fetch(request) {
    if (DELAY_MS > 0) await Bun.sleep(DELAY_MS);

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/auth/login" || path === "/auth/logout") resetStepUp();
    if (path === "/auth/verify-password" && request.method === "POST") {
      return verifyPassword(request);
    }
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
    if (path.startsWith("/auth/update/")) {
      return json(
        {
          status: 200,
          message: "Berhasil Memperbarui Data User. Silakan Login Kembali",
        },
        200,
        setCookies("", 0),
      );
    }
    // Semua user login boleh mengganti password sendiri (be-sada fcddaf9).
    if (path.startsWith("/auth/change-password/")) {
      const body = (await request.json()) as { oldPassword?: string };

      if (body.oldPassword === "salah") {
        return json(
          {
            status: 400,
            error: "Password lama tidak sesuai. Periksa kembali.",
          },
          400,
        );
      }

      return json({
        status: 200,
        message: "Berhasil mengganti password. Silakan masuk kembali.",
      });
    }
    if (path.startsWith("/auth/")) {
      return json({ status: 200, message: "Berhasil", data: session });
    }

    for (const handle of MOCK_HANDLERS) {
      const response = await handle({
        request,
        url,
        path,
        method: request.method,
        can: (slug: MenuSlug, action: MockAction) =>
          actionsOf(persona, slug).includes(action),
        isAdmin: persona.isAdmin,
        sessionCode: session.code,
      });

      if (response) return response;
    }

    // Daftar pilihan form: tanpa paginasi, 404 saat kosong.
    if (path.startsWith("/ddl/")) {
      const rows = ddlRows(path.slice(5), url.searchParams);

      if (!rows) return json({ status: 404, error: "Tidak Ditemukan" }, 404);
      if (rows.length === 0) {
        return json({ status: 404, error: "Data Tidak Ditemukan" }, 404);
      }

      return json({
        status: 200,
        message: "Berhasil Mendapatkan Data",
        data: rows,
      });
    }

    /**
     * Simpan jemaat. Jawaban galatnya bisa dipilih lewat `MOCK_SAVE_ERROR`,
     * karena tiga jalur galat di form (galat field, galat form, galat server)
     * tidak bisa dinilai dengan mata tanpa cara memunculkannya.
     */
    if (path === "/jemaat" && request.method === "POST") {
      const failure = saveFailure();
      if (failure) return failure;

      const body = await readBody<JemaatBody>(request);
      const keluargaId = body.keluargaId ?? null;
      const zoneRejected = zoneFailure(body, keluargaId);
      if (zoneRejected) return zoneRejected;

      const code = `JMT-${String(rows.length + 1).padStart(4, "0")}`;
      const keluarga = (
        ddlRows("keluarga", new URLSearchParams()) as JemaatRow["keluarga"][]
      ).find((row) => row?.id === keluargaId);

      // Barisnya benar-benar DITAMBAHKAN ke daftar (hanya di memori, hilang
      // saat tiruan dimatikan): tanpa itu, kembali ke daftar setelah simpan
      // tidak memperlihatkan baris baru maupun sorotannya, dan alur yang
      // justru paling perlu dinilai user tidak bisa dilihat sama sekali.
      rows.unshift({
        code,
        name: body.name,
        gender: body.gender,
        birthDate: body.birthDate ? `${body.birthDate}T00:00:00.000Z` : null,
        type: body.typeJemaat,
        roleInFamily: body.roleInFamily ?? null,
        keluarga: keluarga
          ? { id: keluarga.id, code: keluarga.code, name: keluarga.name }
          : null,
        status: body.statusJemaat,
        zoneChurch: zoneOf(
          (keluargaId ? keluargaZoneOf(keluargaId) : null) ?? body.zoneChurchId,
        ),
      });

      return json(
        {
          status: 201,
          message: "Berhasil Membuat Data Jemaat",
          data: { code },
        },
        201,
      );
    }

    // Detail satu jemaat, untuk mengisi form ubah. Bentuknya = badan `PUT`
    // plus `code`, `additional[]`, dan relasi — lihat `jemaat.service.ts`.
    const detail = path.match(/^\/jemaat\/([^/]+)$/);
    if (detail && request.method === "GET") {
      const row = rows.find((item) => item.code === detail[1]);

      if (!row)
        return json({ status: 404, error: "Jemaat Tidak Ditemukan" }, 404);

      return json({
        status: 200,
        message: "Berhasil Mendapatkan Jemaat",
        data: jemaatDetail(row),
      });
    }

    // Ubah jemaat. `additional` yang TIDAK dikirim berarti "jangan disentuh"
    // (kontrak be-sada 2026-09-23), jadi tiruan ini pun tidak menyentuhnya.
    if (detail && request.method === "PUT") {
      const failure = saveFailure();
      if (failure) return failure;

      const body = await readBody<JemaatBody>(request);
      const current = rows.find((item) => item.code === detail[1]);
      const zoneRejected = zoneFailure(
        body,
        body.keluargaId === undefined
          ? (current?.keluarga?.id ?? null)
          : body.keluargaId,
      );
      if (zoneRejected) return zoneRejected;

      return json({
        status: 200,
        message: "Berhasil Mengubah Data Jemaat",
        data: { ...body, code: detail[1] },
      });
    }

    if (path === "/jemaat") {
      if (process.env.MOCK_500) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }

      const filter = (url.searchParams.get("filter") ?? "").toLowerCase();
      const status = url.searchParams.get("status") ?? "";
      const page = Number(url.searchParams.get("page") ?? 1);

      // Kontrak B15: `zone=2`, `zone=1,2`, dan `zone=1&zone=2` (boleh
      // dicampur); nilai bukan bilangan bulat positif → 400 per nilai.
      const zoneValues = url.searchParams
        .getAll("zone")
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
      const badZone = zoneValues.findIndex(
        (value) => !/^[1-9]\d*$/.test(value),
      );

      if (badZone !== -1) {
        return json(
          {
            status: 400,
            error: "Validasi gagal",
            issues: [
              {
                path: `zone.${badZone}`,
                message: "Wilayah harus berupa angka",
              },
            ],
          },
          400,
        );
      }

      const zones = new Set(zoneValues.map(Number));
      const limit = Number(url.searchParams.get("limit") ?? 10);

      if (page === Number(process.env.MOCK_FAIL_PAGE)) {
        return json({ status: 500, error: "Kesalahan server." }, 500);
      }

      const matched = rows.filter(
        (row) =>
          (!filter ||
            row.name.toLowerCase().includes(filter) ||
            row.code.toLowerCase().includes(filter)) &&
          (!status || row.status === status) &&
          (zones.size === 0 || zones.has(row.zoneChurch?.id ?? -1)),
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

    // Tanpa paginasi; 200 [] bila kosong.
    if (path === "/report/jemaat/type-gender") {
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Report",
        data: jemaatTypeGender(),
      });
    }

    // 200 `[]` bila kosong — tidak ada 404 di endpoint "saya".
    if (path === "/persembahan/saya") {
      if (Date.now() >= stepUp.expiresAt) {
        return json(
          {
            status: 403,
            error: "Verifikasi Password Diperlukan",
            code: "STEP_UP_REQUIRED",
          },
          403,
        );
      }
      if (process.env.MOCK_OFFERINGS === "500") {
        return json({ status: 500, error: "Kesalahan Server" }, 500);
      }

      const all =
        process.env.MOCK_OFFERINGS === "empty"
          ? []
          : listMyOfferings(url.searchParams, persona.jemaatName);
      const { page, limit } = paging(url);
      return json({
        status: 200,
        message: "Berhasil Mendapatkan Riwayat Persembahan Anda",
        totalData: all.length,
        totalPage: Math.ceil(all.length / limit),
        data: all.slice((page - 1) * limit, page * limit),
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
  const next = Bun.spawn(
    ["bunx", "next", "dev", "-H", HOST, "-p", String(WEB_PORT)],
    {
      stdio: ["inherit", "inherit", "inherit"],
      env: {
        ...process.env,
        API_BASE_URL: `http://localhost:${API_PORT}/api`,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
        MEDIA_ORIGIN: `http://localhost:${API_PORT}`,
      },
    },
  );

  process.exit(await next.exited);
}

export {};
