/**
 * Persona dan data dashboard untuk `dev:mock`. Hanya endpoint yang MEMANG ADA
 * di be-sada; bentuk respons disalin dari controller/repository-nya (rujukan
 * berkas di tiap fungsi). Widget yang endpoint-nya belum ada memakai fixture
 * FE di `src/features/beranda/dummy.ts`, bukan tiruan di sini.
 *
 *   MOCK_PERSONA=admin (bawaan) | sekretariat | bendahara | bendahara2 | majelis | operator
 *                | koordinator | panitia
 *
 * `admin` = pohon menu lengkap dengan semua aksi (be-sada menyintesis aksi
 * untuk `isAdmin`) — dipakai untuk menilai sidebar 12 domain / 61 layar.
 */
import { MENU, type MenuSlug } from "../src/config/menu";
import { toDateKey } from "../src/features/beranda/model";
import { MENU_ACTIONS, type MenuAction } from "../src/types/menu";

type Action = MenuAction;

export type Persona = {
  roleName: string;
  isAdmin: boolean;
  jemaatName: string;
  /** null = semua layar, semua aksi. */
  grants: Partial<Record<MenuSlug, Action[]>> | null;
};

const V: Action[] = ["VIEW"];

/**
 * Sekretariat memang boleh menambah DAN mengubah data jemaat
 * (docs/12-form-jemaat.md §5). `MOCK_NO_CREATE` dan `MOCK_NO_UPDATE`
 * mencabutnya satu per satu, supaya gate tombol "+" dan aksi "Ubah" bisa
 * dinilai lewat render, bukan hanya lewat unit test.
 */
const JEMAAT_ACTIONS: Action[] = [
  "VIEW",
  ...(process.env.MOCK_NO_CREATE ? [] : (["CREATE"] as Action[])),
  ...(process.env.MOCK_NO_UPDATE ? [] : (["UPDATE"] as Action[])),
];

// Sekretariat mengelola seluruh sub menu Kejemaatan; MOCK_NO_* mencabut satu per satu.
const KEJEMAATAN_ACTIONS: Action[] = [
  "VIEW",
  ...(process.env.MOCK_NO_CREATE ? [] : (["CREATE"] as Action[])),
  ...(process.env.MOCK_NO_UPDATE ? [] : (["UPDATE"] as Action[])),
  ...(process.env.MOCK_NO_DELETE ? [] : (["DELETE"] as Action[])),
];

// be-sada PENDAFTARAN_EVENT tanpa UPDATE; MOCK_NO_CREATE/DELETE mencabut.
const REGISTRATION_ACTIONS: Action[] = KEJEMAATAN_ACTIONS.filter(
  (action) => action !== "UPDATE",
);

// be-sada STOCK_MOVEMENT tanpa UPDATE dan DELETE; MOCK_NO_CREATE mencabut.
const LEDGER_ACTIONS: Action[] = KEJEMAATAN_ACTIONS.filter(
  (action) => action === "VIEW" || action === "CREATE",
);

// be-sada PERSEMBAHAN tanpa UPDATE: koreksi lewat void, yang dijaga DELETE.
const PERSEMBAHAN_ACTIONS: Action[] = KEJEMAATAN_ACTIONS.filter(
  (action) => action !== "UPDATE",
);

// be-sada FISCAL_PERIOD tanpa DELETE; tutup dan buka kembali sama-sama UPDATE.
const PERIOD_ACTIONS: Action[] = KEJEMAATAN_ACTIONS.filter(
  (action) => action !== "DELETE",
);

// be-sada BANK_DEPOSIT tanpa UPDATE: setoran final, koreksi lewat batal.
const SETORAN_ACTIONS: Action[] = KEJEMAATAN_ACTIONS.filter(
  (action) => action !== "UPDATE",
);

// be-sada ACCOUNTING_SETTING hanya VIEW + UPDATE: kunci lahir dari sync.
const SETTING_ACTIONS: Action[] = KEJEMAATAN_ACTIONS.filter(
  (action) => action === "VIEW" || action === "UPDATE",
);

// Dokumen beralur Anggaran: be-sada menjaga CRUD penuh, dan `/pengajuan` ikut
// UPDATE (tidak ada aksi menu kedelapan).
const BUDGET_DOC_ACTIONS: Action[] = KEJEMAATAN_ACTIONS;

// Peran komisi di Kas Keluar: CREATE saja, JANGAN PERNAH UPDATE. Pembebasan
// gerbang dijaga KAS_KELUAR UPDATE, jadi komisi yang memegangnya bisa
// membebaskan blokirnya sendiri — dan gerbang yang penerimanya bisa membukanya
// bukan gerbang.
const KOMISI_EXPENSE_ACTIONS: Action[] = LEDGER_ACTIONS;

// Penanda tangan dan pengaju: be-sada hanya menjaga VIEW + UPDATE di menu ini.
const APPROVAL_ACTIONS: Action[] = [
  "VIEW",
  ...(process.env.MOCK_NO_UPDATE ? [] : (["UPDATE"] as Action[])),
];

export const PERSONAS: Record<string, Persona> = {
  // docs/design/dashboard-desktop.md §3e.
  sekretariat: {
    roleName: "Sekretariat",
    isAdmin: false,
    jemaatName: "Andreas Sitanggang",
    grants: {
      [MENU.DAFTAR_JEMAAT]: JEMAAT_ACTIONS,
      [MENU.KELUARGA]: KEJEMAATAN_ACTIONS,
      [MENU.PERNIKAHAN]: KEJEMAATAN_ACTIONS,
      [MENU.RIWAYAT_JEMAAT]: KEJEMAATAN_ACTIONS,
      [MENU.ROLE_JEMAAT]: KEJEMAATAN_ACTIONS,
      [MENU.BAPEL]: KEJEMAATAN_ACTIONS,
      [MENU.WILAYAH]: KEJEMAATAN_ACTIONS,
      [MENU.REPORT_JEMAAT]: V,
      [MENU.IBADAH]: KEJEMAATAN_ACTIONS,
      [MENU.TIPE_IBADAH]: KEJEMAATAN_ACTIONS,
      [MENU.JADWAL_PELAYAN]: KEJEMAATAN_ACTIONS,
      [MENU.TEMPLATE_JADWAL]: KEJEMAATAN_ACTIONS,
      [MENU.DAFTAR_PELAYAN]: KEJEMAATAN_ACTIONS,
      [MENU.ROLE_PELAYAN]: KEJEMAATAN_ACTIONS,
      [MENU.SKILL_MUSIK]: KEJEMAATAN_ACTIONS,
      [MENU.EVENT]: KEJEMAATAN_ACTIONS,
      [MENU.PENDAFTARAN_EVENT]: REGISTRATION_ACTIONS,
      [MENU.GALERI]: KEJEMAATAN_ACTIONS,
      [MENU.PENGUMUMAN]: KEJEMAATAN_ACTIONS,
      [MENU.PEMINJAMAN_RUANG]: KEJEMAATAN_ACTIONS,
      [MENU.RUANG]: KEJEMAATAN_ACTIONS,
      [MENU.PROGRAM]: LEDGER_ACTIONS,
      [MENU.BUDGET_REALIZATION]: V,
      // Biaya yang diterima user bersama scoping: tanpa BUDGET VIEW,
      // sekretariat tidak bisa menemukan usulan yang ia ketikkan untuk komisi
      // yang belum memakai aplikasi. Hibah itu sekaligus memperlihatkan
      // alokasi setiap komisi kepadanya.
      [MENU.BUDGET]: V,
      [MENU.ASSET_MASTER]: KEJEMAATAN_ACTIONS,
      [MENU.ITEM_CATEGORY]: KEJEMAATAN_ACTIONS,
      [MENU.SATUAN]: KEJEMAATAN_ACTIONS,
      [MENU.STOCK_ITEM]: KEJEMAATAN_ACTIONS,
      [MENU.STOCK_MOVEMENT]: LEDGER_ACTIONS,
      [MENU.STOK_OPNAME]: KEJEMAATAN_ACTIONS,
      [MENU.ASSET_TRANSACTION]: KEJEMAATAN_ACTIONS,
      [MENU.SUPPLIER]: KEJEMAATAN_ACTIONS,
      [MENU.PURCHASE_REQUEST]: KEJEMAATAN_ACTIONS,
      [MENU.PURCHASE_ORDER]: KEJEMAATAN_ACTIONS,
      [MENU.GOODS_RECEIPT]: LEDGER_ACTIONS,
      [MENU.CURRENCY]: V,
      [MENU.PERSEMBAHAN]: LEDGER_ACTIONS,
      [MENU.KAS_MASUK]: LEDGER_ACTIONS,
      // SDM tanpa gaji: sekretariat mengurus orangnya, bukan bayarannya.
      // EMPLOYEE_CONTRACT, PAYROLL_COMPONENT, dan PAYROLL sengaja TIDAK di sini
      // — ketiganya mengembalikan nominal per orang, dan U-C membatasinya ke
      // bendahara. Pasangan sekretariat/bendahara itulah yang membuat gerbang
      // VIEW tujuh layar SDM bisa dinilai dua arah lewat render.
      [MENU.EMPLOYEE]: KEJEMAATAN_ACTIONS,
      [MENU.LEAVE_TYPE]: KEJEMAATAN_ACTIONS,
      [MENU.ATTENDANCE]: KEJEMAATAN_ACTIONS,
      [MENU.LEAVE]: KEJEMAATAN_ACTIONS,
    },
  },
  // §3b, plus IBADAH/EVENT VIEW supaya Agenda dan "· 2 kebaktian" tampil, dan
  // APPROVAL_REQUEST sebagai pengaju sekaligus penanda tangan tahap Bendahara.
  bendahara: {
    roleName: "Bendahara",
    isAdmin: false,
    jemaatName: "Maria Hutapea",
    grants: {
      [MENU.PERSEMBAHAN]: PERSEMBAHAN_ACTIONS,
      [MENU.KAS_MASUK]: KEJEMAATAN_ACTIONS,
      [MENU.KAS_KELUAR]: KEJEMAATAN_ACTIONS,
      [MENU.JOURNAL_ENTRY]: KEJEMAATAN_ACTIONS,
      [MENU.CHART_OF_ACCOUNT]: KEJEMAATAN_ACTIONS,
      [MENU.FISCAL_PERIOD]: PERIOD_ACTIONS,
      [MENU.TIPE_PERSEMBAHAN]: KEJEMAATAN_ACTIONS,
      [MENU.ACCOUNTING_SETTING]: SETTING_ACTIONS,
      [MENU.BANK_DEPOSIT]: SETORAN_ACTIONS,
      [MENU.FINANCIAL_STATEMENT]: V,
      [MENU.SUPPLIER_INVOICE]: V,
      [MENU.PAYMENT]: V,
      // Tiga menu yang mengembalikan nominal per orang (§2.4). Hanya di sini.
      [MENU.PAYROLL]: KEJEMAATAN_ACTIONS,
      [MENU.EMPLOYEE_CONTRACT]: KEJEMAATAN_ACTIONS,
      [MENU.PAYROLL_COMPONENT]: KEJEMAATAN_ACTIONS,
      // Picker karyawan di form Kontrak, baca saja. Sepasang dengan grant
      // penuh sekretariat ini jadi satu-satunya tempat di mock yang menilai
      // "punya VIEW, tidak punya CREATE/UPDATE" dengan persona sungguhan.
      [MENU.EMPLOYEE]: V,
      [MENU.IBADAH]: V,
      [MENU.EVENT]: V,
      [MENU.APPROVAL_REQUEST]: APPROVAL_ACTIONS,
      [MENU.DEPRECIATION]: KEJEMAATAN_ACTIONS,
      [MENU.ASSET_MASTER]: V,
      [MENU.SUPPLIER]: V,
      [MENU.PURCHASE_REQUEST]: V,
      [MENU.PURCHASE_ORDER]: V,
      [MENU.CURRENCY]: KEJEMAATAN_ACTIONS,
      [MENU.BUDGET]: KEJEMAATAN_ACTIONS,
      [MENU.PROGRAM]: V,
      [MENU.BUDGET_REALIZATION]: V,
    },
  },
  // Pengurus komisi: mengusulkan program dan mempertanggungjawabkan
  // pemakaiannya. Tanpa BUDGET (keputusan user: komisi tidak melihat
  // alokasi komisi lain), dan Kas Keluar CREATE saja.
  komisi: {
    roleName: "Pengurus Komisi",
    isAdmin: false,
    jemaatName: "Daniel Panggabean",
    grants: {
      [MENU.PROGRAM]: BUDGET_DOC_ACTIONS,
      [MENU.BUDGET_REALIZATION]: BUDGET_DOC_ACTIONS,
      [MENU.KAS_KELUAR]: KOMISI_EXPENSE_ACTIONS,
      [MENU.APPROVAL_REQUEST]: APPROVAL_ACTIONS,
      [MENU.IBADAH]: V,
      [MENU.EVENT]: V,
    },
  },
  // §3c, dengan FINANCIAL_STATEMENT (keputusan admin; tanpanya grid merapat).
  // Bendahara II (BA §7): mengajukan Kas Keluar supaya bendahara bisa
  // menandatanganinya — pengaju tidak pernah menandatangani permintaannya
  // sendiri. Tanpa Laporan Keuangan, jadi Beranda-nya tetap strip umum.
  bendahara2: {
    roleName: "Bendahara II",
    isAdmin: false,
    jemaatName: "Ruth Simanjuntak",
    grants: {
      [MENU.KAS_KELUAR]: LEDGER_ACTIONS,
      [MENU.KAS_MASUK]: LEDGER_ACTIONS,
      [MENU.PERSEMBAHAN]: V,
      [MENU.CHART_OF_ACCOUNT]: V,
      [MENU.APPROVAL_REQUEST]: V,
      [MENU.DAFTAR_JEMAAT]: V,
    },
  },
  majelis: {
    roleName: "Majelis Jemaat",
    isAdmin: false,
    jemaatName: "Pdt. Yohanes Simatupang",
    grants: {
      [MENU.APPROVAL_REQUEST]: APPROVAL_ACTIONS,
      [MENU.FINANCIAL_STATEMENT]: process.env.MOCK_MAJELIS_NO_FINANCE
        ? undefined
        : V,
      [MENU.BUDGET]: KEJEMAATAN_ACTIONS,
      [MENU.PROGRAM]: V,
      [MENU.BUDGET_REALIZATION]: V,
      [MENU.IBADAH]: V,
      [MENU.EVENT]: V,
      [MENU.REPORT_JEMAAT]: V,
      [MENU.PURCHASE_REQUEST]: V,
    },
  },
  // Non-admin pemegang menu Pengaturan: be-sada menolak tambah akun dan
  // mengatur role (hanya admin), dan membatasi izin yang boleh diberikan ke
  // izin yang dipegang sendiri. MOCK_NO_* mencabut aksi USER/USER_ROLE.
  operator: {
    roleName: "Operator Sistem",
    isAdmin: false,
    jemaatName: "Yosua Sembiring",
    grants: {
      [MENU.USER]: [...KEJEMAATAN_ACTIONS, "RESET"],
      [MENU.USER_ROLE]: KEJEMAATAN_ACTIONS,
      [MENU.ACTIVITY_LOG]: V,
      [MENU.HOLIDAY]: KEJEMAATAN_ACTIONS,
      [MENU.DAFTAR_JEMAAT]: V,
      [MENU.KELUARGA]: V,
      [MENU.APPROVAL_WORKFLOW]: KEJEMAATAN_ACTIONS,
    },
  },
  // Pelayanan tanpa master: membuktikan ddl yang dijaga menu pemakai (B1, B2).
  koordinator: {
    roleName: "Koordinator Pelayanan",
    isAdmin: false,
    jemaatName: "Christian Wijaya",
    grants: {
      [MENU.DAFTAR_PELAYAN]: KEJEMAATAN_ACTIONS,
      [MENU.JADWAL_PELAYAN]: KEJEMAATAN_ACTIONS,
    },
  },
  // Pendaftaran tanpa Event: membuktikan /ddl/event dan /ddl/jemaat (B3, B4).
  panitia: {
    roleName: "Panitia Kegiatan",
    isAdmin: false,
    jemaatName: "Hanna Simorangkir",
    grants: {
      [MENU.PENDAFTARAN_EVENT]: REGISTRATION_ACTIONS,
    },
  },
  admin: {
    roleName: "Administrator",
    isAdmin: true,
    jemaatName: "Admin Sistem",
    grants: null,
  },
};

const ALL_ACTIONS: Action[] = [...MENU_ACTIONS];

export const PERSONA_KEY = process.env.MOCK_PERSONA ?? "admin";

export const currentPersona = (): Persona => {
  const persona = PERSONAS[PERSONA_KEY];

  if (!persona) {
    throw new Error(
      `MOCK_PERSONA tidak dikenal: "${PERSONA_KEY}". Pilih: ${Object.keys(PERSONAS).join(", ")}.`,
    );
  }

  return persona;
};

// Satu akun mock untuk semua persona; "saya" di pengajuan dan tanda tangan.
export const SESSION_USER_ID = 1;

// Jabatan Role Jemaat yang dipegang persona hari ini; bapelId = id `ddl/bapel`.
/**
 * `bapelId` null = jabatan church-wide (mis. Ketua Majelis Jemaat). Ia **tidak
 * melebarkan lingkup komisi apa pun** — cermin `scopeOf` be-sada, yang menyaring
 * null sebelum membangun `bapelIds`.
 */
export const PERSONA_POSITIONS: Record<
  string,
  { name: string; bapelId: number | null; bapel: { name: string } }[]
> = {
  majelis: [{ name: "Ketua", bapelId: 1, bapel: { name: "Majelis Jemaat" } }],
  sekretariat: [
    { name: "Sekretaris", bapelId: 2, bapel: { name: "Komisi Pemuda" } },
  ],
  bendahara: [
    { name: "Bendahara", bapelId: 1, bapel: { name: "Majelis Jemaat" } },
  ],
  komisi: [{ name: "Ketua", bapelId: 2, bapel: { name: "Komisi Pemuda" } }],
};

export const actionsOf = (persona: Persona, slug: string): Action[] =>
  persona.grants === null
    ? ALL_ACTIONS
    : (persona.grants[slug as MenuSlug] ?? []);

/** Guard be-sada: `Authorization(MENU.X, "VIEW")`; admin melewatinya. */
export const GUARD: Record<string, MenuSlug> = {
  "/persetujuan": MENU.APPROVAL_REQUEST,
  "/laporan-keuangan/neraca": MENU.FINANCIAL_STATEMENT,
  "/laporan-keuangan/surplus-defisit": MENU.FINANCIAL_STATEMENT,
  "/kas-keluar": MENU.KAS_KELUAR,
  "/pagu-anggaran": MENU.BUDGET,
  "/setelan-anggaran": MENU.BUDGET,
  "/program": MENU.PROGRAM,
  "/laporan-budget": MENU.BUDGET_REALIZATION,
  "/faktur-supplier": MENU.SUPPLIER_INVOICE,
  "/pembayaran": MENU.PAYMENT,
  "/payroll": MENU.PAYROLL,
  "/jemaat": MENU.DAFTAR_JEMAAT,
};

export const guardSlugOf = (path: string): MenuSlug | undefined =>
  path.startsWith("/report/jemaat/") ? MENU.REPORT_JEMAAT : GUARD[path];

// ---------------------------------------------------------------------------
// Tanggal (WIB). "Hari ini" = hari mock dijalankan, jadi Beranda selalu terisi.

const today = () => toDateKey(new Date());

// Tahun kode dokumen dari jam, bukan periodenya: `generateCode` be-sada.
const codeYear = () => today().slice(0, 4);

export const addDays = (key: string, days: number): string => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const iso = (key: string) => `${key}T00:00:00.000Z`;

const audit = {
  createdBy: 3,
  createdAt: "2026-09-01T02:00:00.000Z",
  updatedBy: null,
  updatedAt: null,
  deletedBy: null,
  deletedAt: null,
};

// Seed bersama Peribadahan: id sama di handler ibadah, tipe-ibadah, dan Beranda.
export const TYPE_IBADAH_ROWS = [
  { id: 1, code: "TYP_IBD-0001", name: "Ibadah Minggu I", isActive: true },
  { id: 2, code: "TYP_IBD-0002", name: "Ibadah Minggu II", isActive: true },
  { id: 3, code: "TYP_IBD-0003", name: "Persekutuan Doa", isActive: true },
  { id: 4, code: "TYP_IBD-0004", name: "Ibadah Pemuda", isActive: true },
  { id: 5, code: "TYP_IBD-0005", name: "Ibadah Padang", isActive: false },
  { id: 6, code: "TYP_IBD-0006", name: "Ibadah Wilayah", isActive: true },
];

export const ROOM_ROWS = [
  { id: 1, code: "RM-0001", name: "Gedung Gereja" },
  { id: 2, code: "RM-0002", name: "Aula Serbaguna" },
  { id: 3, code: "RM-0003", name: "Ruang Pemuda" },
];

// ---------------------------------------------------------------------------
// GET /persembahan/saya — `persembahan.repository.ts:6-31`. 200 `[]` bila
// kosong (bukan 404). `periodStart`/`periodEnd` "YYYY-MM", pada `period`.

export function listMyOfferings(params: URLSearchParams, jemaatName: string) {
  const year = today().slice(0, 4);
  const rows = [9, 8, 7, 6, 5].map((month, index) => {
    const period = `${year}-${String(month).padStart(2, "0")}-01`;
    return {
      id: 50 - index,
      publicId: `psb-${index}`,
      code: `PSB-${codeYear()}-${String(50 - index).padStart(4, "0")}`,
      typePersembahanId: 1,
      jemaatId: 12,
      donorName: null,
      paymentId: null,
      amount: String(index === 2 ? 1_000_000 : 650_000),
      period: iso(period),
      receiveMethod: "TRANSFER",
      receivedDate: iso(`${year}-${String(month).padStart(2, "0")}-07`),
      receivedBy: 3,
      ibadahId: null,
      status: "ACTIVE",
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
      createdBy: 3,
      createdAt: iso(period),
      typePersembahan: {
        id: 1,
        code: "TYP_PSB-0001",
        name: "Persembahan Bulanan",
        hasPeriod: true,
      },
      jemaat: { id: 12, code: "JMT-0012", name: jemaatName },
      ibadah: null,
    };
  });
  const start = params.get("periodStart");
  const end = params.get("periodEnd");

  return rows.filter(
    (row) =>
      (!start || row.period.slice(0, 7) >= start.slice(0, 7)) &&
      (!end || row.period.slice(0, 7) <= end.slice(0, 7)),
  );
}

// ---------------------------------------------------------------------------
// GET /laporan-keuangan/{neraca,surplus-defisit} — `laporan_keuangan.service.ts`
// + `financialReport.ts`. Pohon akun; uang = string Decimal; hanya jurnal
// POSTED. Bulan setelah hari ini tidak punya posting → 0.

type AccountNode = {
  id: number;
  code: string;
  name: string;
  type: string;
  parentAccountId: number | null;
  balance: string;
  total: string;
  children: AccountNode[];
};

const node = (
  id: number,
  code: string,
  name: string,
  type: string,
  total: number,
  children: AccountNode[] = [],
): AccountNode => ({
  id,
  code,
  name,
  type,
  parentAccountId: null,
  balance: String(children.length ? 0 : total),
  total: String(total),
  children,
});

/**
 * Masuk/keluar satu bulan (rupiah). Deterministik per bulan DAN tahun —
 * tahun sebelumnya lebih kecil, supaya delta "vs tahun lalu" punya angka.
 */
const monthFlow = (month: number, year: number) => {
  const base = {
    income: 70_000_000 + ((month * 7919) % 25) * 1_000_000,
    expense: 52_000_000 + ((month * 104_729) % 22) * 1_000_000,
  };
  const yearsBack = Number(today().slice(0, 4)) - year;

  return yearsBack <= 0
    ? base
    : {
        income: Math.round(base.income * (1 - 0.11 * yearsBack)),
        expense: Math.round(base.expense * (1 - 0.04 * yearsBack)),
      };
};

export function surplusDefisit(from: string, to: string) {
  const month = Number(from.slice(5, 7));
  const flow =
    from > today()
      ? { income: 0, expense: 0 }
      : monthFlow(month, Number(from.slice(0, 4)));
  // Empat jenis persembahan (48/31/14/7%) — bentuk yang sama dengan pohon
  // INCOME be-sada; dipakai widget "Pemasukan per jenis".
  const income = [
    node(10, "4-0000", "Pendapatan", "INCOME", flow.income, [
      node(11, "4-1000", "Kolekte", "INCOME", Math.round(flow.income * 0.48)),
      node(
        12,
        "4-2000",
        "Perpuluhan",
        "INCOME",
        Math.round(flow.income * 0.31),
      ),
      node(13, "4-3000", "Syukur", "INCOME", Math.round(flow.income * 0.14)),
      node(
        14,
        "4-4000",
        "Persembahan khusus",
        "INCOME",
        Math.round(flow.income * 0.07),
      ),
    ]),
  ];
  const expense = [
    node(20, "5-0000", "Beban", "EXPENSE", flow.expense, [
      node(21, "5-1000", "Beban pelayanan", "EXPENSE", flow.expense * 0.6),
      node(22, "5-2000", "Beban operasional", "EXPENSE", flow.expense * 0.4),
    ]),
  ];

  return {
    from,
    to,
    income,
    expense,
    totals: {
      income: String(flow.income),
      expense: String(flow.expense),
      surplus: String(flow.income - flow.expense),
    },
  };
}

export function neraca(date: string) {
  const assets = 248_560_000;
  return {
    date,
    assets: [
      node(1, "1-0000", "Aset", "ASSET", assets, [
        node(2, "1-1000", "Kas", "ASSET", 18_560_000),
        node(3, "1-1100", "Bank", "ASSET", 230_000_000),
      ]),
    ],
    liabilities: [],
    equity: [node(30, "3-0000", "Aset bersih", "EQUITY", 136_560_000)],
    totals: {
      assets: String(assets),
      liabilities: "0",
      equity: "136560000",
      surplus: "112000000",
    },
    balanced: true,
  };
}

// ---------------------------------------------------------------------------
// GET /kas-keluar — `kas_keluar.repository.ts:6-19, 93`. `status` hanya
// DRAFT|PAID|CANCELLED; urut `expenseDate desc`.

const cashExpense = (
  id: number,
  daysAgo: number,
  description: string,
  payee: string,
  amount: number,
  bapel: string | null,
  status: string,
) => ({
  id,
  publicId: `kk-${id}`,
  code: `KK-2026-${String(id).padStart(4, "0")}`,
  expenseDate: iso(addDays(today(), -daysAgo)),
  description,
  payee,
  paidFromAccountId: 2,
  bapelId: bapel ? 4 : null,
  programId: null,
  status,
  totalAmount: String(amount),
  method: null,
  reference: null,
  approvedBy: null,
  approvedAt: null,
  ...audit,
  paidFromAccount: { code: "1-1000", name: "Kas" },
  bapel: bapel ? { code: "BPL-004", name: bapel } : null,
  lines: [],
});

export function listCashExpense(params: URLSearchParams) {
  const rows = [
    cashExpense(
      12,
      1,
      "Konsumsi retret",
      "Katering Sumber Rejeki",
      4_500_000,
      "Komisi Pemuda",
      "DRAFT",
    ),
    cashExpense(
      11,
      3,
      "Sewa sound system",
      "CV Nada Indah",
      2_100_000,
      "Komisi Musik",
      "DRAFT",
    ),
    cashExpense(10, 6, "Listrik September", "PLN", 1_850_000, null, "DRAFT"),
    cashExpense(
      9,
      9,
      "Alat tulis sekretariat",
      "Toko Buku Agape",
      640_000,
      null,
      "PAID",
    ),
  ];
  const status = params.get("status");

  return ["DRAFT", "PAID", "CANCELLED"].includes(status ?? "")
    ? rows.filter((row) => row.status === status)
    : rows;
}

// ---------------------------------------------------------------------------
// GET /report/jemaat/birth/:month — `report.service.ts:112-120`. Tanpa
// paginasi, 404 bila kosong, urut hari dalam bulan.

export function listBirthdays(month: number) {
  if (!(month >= 1 && month <= 12)) return [];
  const year = Number(today().slice(0, 4));
  return [
    ["Bethari Ayu Kusuma", "P", 3, 1994],
    ["Christian Wijaya", "L", 11, 1978],
    ["Hanna Simorangkir", "P", 19, 2001],
    ["Kevin Nainggolan", "L", 27, 1966],
  ].map(([name, gender, day, born]) => ({
    name,
    gender,
    birthDate: iso(
      `${born}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    ),
    umur: year - Number(born),
  }));
}

// ---------------------------------------------------------------------------
// GET /faktur-supplier — `faktur_supplier.repository.ts:5-45`. `status`
// hanya SATU nilai (daftar berkoma → 400). Urut `dueDate` naik.

const invoice = (
  id: number,
  dueInDays: number,
  supplier: string,
  total: number,
  paid: number,
  status: string,
) => ({
  id,
  publicId: `inv-${id}`,
  code: `INV-${codeYear()}-${String(id).padStart(4, "0")}`,
  supplierInvoiceNumber: `SUP/IX/${id}`,
  supplierId: id,
  purchaseOrderId: null,
  invoiceDate: iso(addDays(today(), dueInDays - 30)),
  dueDate: iso(addDays(today(), dueInDays)),
  currencyCode: "IDR",
  exchangeRate: "1",
  totalForeignCurrency: String(total),
  totalIDR: String(total),
  paidAmountIDR: String(paid),
  status,
  ...audit,
  supplier: { publicId: `sup-${id}`, code: `SUP-000${id}`, name: supplier },
  currency: { code: "IDR", name: "Rupiah", symbol: "Rp" },
  purchaseOrder: null,
  payments: [],
});

export function listInvoices(params: URLSearchParams) {
  const rows = [
    invoice(31, -4, "Katering Sumber Rejeki", 2_100_000, 0, "AWAITING_PAYMENT"),
    invoice(32, 3, "CV Nada Indah", 3_400_000, 1_000_000, "PARTIALLY_PAID"),
    invoice(33, 12, "Toko Buku Agape", 1_250_000, 0, "AWAITING_PAYMENT"),
  ];
  const status = params.get("status");

  return status ? rows.filter((row) => row.status === status) : rows;
}

// ---------------------------------------------------------------------------
// GET /pembayaran — `pembayaran.repository.ts:9-21`, urut `id` menurun.

const payment = (
  id: number,
  daysAgo: number,
  amount: number,
  status: string,
  purpose: string,
  jemaatName: string | null,
) => ({
  id,
  publicId: `pay-${id}`,
  code: `PAY-${codeYear()}-${String(id).padStart(4, "0")}`,
  purpose,
  amount: String(amount),
  status,
  method: "QRIS",
  providerTransactionId: `inv_${id}`,
  paidAt: null,
  expiredAt: iso(addDays(today(), -daysAgo + 1)),
  invoiceUrl: null,
  typePersembahanId: 1,
  jemaatId: jemaatName ? 12 : null,
  donorName: jemaatName ? null : "Hamba Tuhan",
  period: null,
  createdBy: 4,
  createdAt: `${addDays(today(), -daysAgo)}T02:00:00.000Z`,
  updatedAt: null,
  typePersembahan: { publicId: "tp-1", code: "TP-0001", name: "Perpuluhan" },
  jemaat: jemaatName
    ? { publicId: "jmt-12", code: "JMT-0012", name: jemaatName }
    : null,
  persembahan: null,
  eventRegistration: null,
});

export function listPayments(params: URLSearchParams) {
  const rows = [
    payment(118, 1, 250_000, "FAILED", "PERSEMBAHAN", "Debora Manurung"),
    payment(117, 3, 150_000, "EXPIRED", "PERSEMBAHAN", null),
    payment(116, 5, 500_000, "PAID", "PERSEMBAHAN", "Christian Wijaya"),
  ];
  const status = params.get("status");

  return status ? rows.filter((row) => row.status === status) : rows;
}

// ---------------------------------------------------------------------------
// GET /report/jemaat/type-gender — `report.service.ts:14-32`. Tanpa paginasi;
// 200 `[]` bila kosong (cabang 404 tidak terjangkau).

export function jemaatTypeGender() {
  return [
    { typeJemaat: "ANGGOTA", ALL: 1204, L: 552, P: 652 },
    { typeJemaat: "SIMPATISAN", ALL: 86, L: 39, P: 47 },
  ];
}

// ---------------------------------------------------------------------------
// Daftar pilihan `GET /ddl/*` (form jemaat).
//
// Bentuknya `{ id, code, name }`, urut nama, tanpa paginasi, dan 404 saat
// kosong — sama seperti `ddl.controller.ts` be-sada. Tiap tingkat alamat
// menyertakan baris `code = "UNKNOWN"`: itu jawaban sah "tidak diketahui",
// jadi FE menampilkannya apa adanya, bukan menyaringnya diam-diam.

const UNKNOWN_ROW = { id: 0, code: "UNKNOWN", name: "Tidak diketahui" };

// Tanpa baris "Tidak diketahui": sejak 2026-09-23 jawaban itu disimpan
// sebagai KOSONG, dan dropdown-nya yang menawarkan pilihan bernilai kosong.
export const PROFESSIONS = [
  "Buruh",
  "Guru",
  "Ibu rumah tangga",
  "Karyawan swasta",
  "Pelajar/mahasiswa",
  "Pendeta",
  "Pensiunan",
  "Perawat",
  "Petani",
  "PNS/ASN",
  "TNI/Polri",
  "Wiraswasta",
];

export const ETHNIC_GROUPS = [
  "Batak Toba",
  "Batak Karo",
  "Jawa",
  "Minahasa",
  "Nias",
  "Sunda",
  "Tionghoa",
  "Timor",
];

export const ZONE_CHURCHES = [
  "Wilayah I",
  "Wilayah II",
  "Wilayah III",
  "Wilayah IV",
];

const rowsOf = (names: string[], prefix: string) =>
  names.map((name, index) => ({
    id: index + 1,
    code: `${prefix}-${index + 1}`,
    name,
  }));

/**
 * Nama keluarga yang sama dengan store `mock/handlers/keluarga.ts`: id, kode,
 * dan nama di `ddl/keluarga` harus menunjuk keluarga yang sama dengan detail
 * Keluarga dan saran tuan rumah Ibadah. `wilayah` = `zoneChurchId` keluarga
 * itu (null = tanpa wilayah); `worshipsHere: false` dan "Halim" (tanpa
 * anggota) membuat Wilayah III tanpa keluarga yang layak menjadi tuan rumah.
 */
export const KELUARGA_SEED: {
  surname: string;
  wilayah: number | null;
  worshipsHere: boolean;
}[] = [
  { surname: "Sitanggang", wilayah: 1, worshipsHere: true },
  { surname: "Kusuma", wilayah: 2, worshipsHere: true },
  { surname: "Wijaya", wilayah: 4, worshipsHere: true },
  { surname: "Manurung", wilayah: 1, worshipsHere: true },
  { surname: "Panggabean", wilayah: null, worshipsHere: true },
  { surname: "Halim", wilayah: 3, worshipsHere: true },
  { surname: "Saragih", wilayah: 2, worshipsHere: true },
  { surname: "Nainggolan", wilayah: 1, worshipsHere: true },
  { surname: "Hutagalung", wilayah: 4, worshipsHere: true },
  { surname: "Simorangkir", wilayah: null, worshipsHere: true },
  { surname: "Tampubolon", wilayah: 2, worshipsHere: true },
  { surname: "Tanuwijaya", wilayah: 3, worshipsHere: false },
  { surname: "Siregar", wilayah: 1, worshipsHere: true },
  { surname: "Lubis", wilayah: 2, worshipsHere: true },
  { surname: "Harahap", wilayah: 4, worshipsHere: true },
  { surname: "Pardede", wilayah: 1, worshipsHere: false },
  { surname: "Sinaga", wilayah: 1, worshipsHere: true },
  { surname: "Gultom", wilayah: 4, worshipsHere: true },
  { surname: "Situmorang", wilayah: 2, worshipsHere: true },
  { surname: "Silalahi", wilayah: null, worshipsHere: true },
  { surname: "Purba", wilayah: 4, worshipsHere: true },
  { surname: "Damanik", wilayah: 4, worshipsHere: true },
  { surname: "Sembiring", wilayah: 1, worshipsHere: true },
  { surname: "Ginting", wilayah: 2, worshipsHere: true },
];

export const keluargaCodeOf = (id: number) =>
  `KK-${String(id).padStart(4, "0")}`;

/**
 * `MOCK_DDL_MANY=1` membesarkan daftar keluarga ke 400 baris: itu ukuran yang
 * membuat combobox harus benar-benar menyaring, dan yang menunjukkan kenapa
 * `?filter=` di be-sada (B9) dibutuhkan. Baris ke-25 dst. hanya ada di ddl.
 */
const KELUARGA_COUNT = process.env.MOCK_DDL_MANY ? 400 : KELUARGA_SEED.length;

/**
 * be-sada: urut nama; `?zoneChurchId=` menyaring keluarga di wilayah itu
 * (baris ke-25 dst. tanpa wilayah). Wilayah tidak dikirim di jawaban.
 */
const KELUARGA = Array.from({ length: KELUARGA_COUNT }, (_, index) => ({
  id: index + 1,
  code: keluargaCodeOf(index + 1),
  name:
    index < KELUARGA_SEED.length
      ? `Keluarga ${KELUARGA_SEED[index].surname}`
      : `Keluarga ${KELUARGA_SEED[index % KELUARGA_SEED.length].surname} ${index + 1}`,
  zoneChurchId: KELUARGA_SEED[index]?.wilayah ?? null,
})).sort((a, b) => a.name.localeCompare(b.name, "id"));

const keluargaDdl = (params: URLSearchParams) => {
  const zone = params.get("zoneChurchId") ?? "";

  return KELUARGA.filter(
    (row) => !/^\d+$/.test(zone) || row.zoneChurchId === Number(zone),
  ).map(({ zoneChurchId: _zone, ...row }) => row);
};

const PROVINCES = [
  { id: 1, code: "32", name: "Jawa Barat" },
  { id: 2, code: "31", name: "DKI Jakarta" },
  { id: 3, code: "36", name: "Banten" },
  UNKNOWN_ROW,
];

const REGENCIES: Record<string, { id: number; code: string; name: string }[]> =
  {
    "32": [
      { id: 11, code: "3273", name: "Kota Bandung" },
      { id: 12, code: "3276", name: "Kota Depok" },
      UNKNOWN_ROW,
    ],
    "31": [{ id: 13, code: "3171", name: "Jakarta Selatan" }, UNKNOWN_ROW],
    "36": [
      { id: 14, code: "3671", name: "Kota Tangerang Selatan" },
      UNKNOWN_ROW,
    ],
  };

const DISTRICTS: Record<string, { id: number; code: string; name: string }[]> =
  {
    "3273": [
      { id: 21, code: "327301", name: "Bandung Kulon" },
      { id: 22, code: "327302", name: "Babakan Ciparay" },
      UNKNOWN_ROW,
    ],
    "3671": [
      { id: 23, code: "367101", name: "Serpong" },
      { id: 24, code: "367102", name: "Pondok Aren" },
      UNKNOWN_ROW,
    ],
  };

const VILLAGES: Record<
  string,
  { id: number; code: string; name: string; postalCode?: string }[]
> = {
  "327301": [
    { id: 31, code: "3273011001", name: "Cijerah", postalCode: "40213" },
    { id: 32, code: "3273011002", name: "Gempolsari", postalCode: "40214" },
    UNKNOWN_ROW,
  ],
  "367101": [
    {
      id: 33,
      code: "3671011001",
      name: "Lengkong Gudang",
      postalCode: "15321",
    },
    { id: 34, code: "3671011002", name: "Rawa Buntu", postalCode: "15318" },
    UNKNOWN_ROW,
  ],
};

/** Daftar untuk satu path `ddl`; `undefined` = endpoint tidak dikenal. */
// `ddl/jemaat` (id, code, name) dan `ddl/bapel`, dipakai semua form Kejemaatan.
export const DDL_JEMAAT = [
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
].map((name, index) => ({
  id: index + 1,
  code: `JMT-${String(index + 1).padStart(4, "0")}`,
  name,
}));

// be-sada ddl/role-user: { id, name } saja, tanpa isAdmin; urut nama.
export const ROLE_USERS = [
  { id: 1, name: "Administrator" },
  { id: 4, name: "Bendahara" },
  { id: 5, name: "Majelis Jemaat" },
  { id: 3, name: "Operator Sistem" },
  { id: 2, name: "Sekretariat" },
];

export const BAPEL_NAMES = [
  "Majelis Jemaat",
  "Komisi Pemuda",
  "Komisi Wanita",
  "Komisi Anak",
  "Komisi Musik",
  "Komisi Diakonia",
];

export function ddlRows(
  name: string,
  params: URLSearchParams,
): unknown[] | undefined {
  /**
   * `?filter=` + `?limit=` — diterima `ddl/keluarga` dan `ddl/jemaat` sejak
   * 2026-09-23, supaya combobox tidak mengunduh seluruh tabel.
   */
  const narrow = (rows: { name: string }[]) => {
    const filter = (params.get("filter") ?? "").toLowerCase();
    const limit = Number(params.get("limit")) || rows.length;
    const matched = filter
      ? rows.filter((row) => row.name.toLowerCase().includes(filter))
      : rows;

    return matched.slice(0, limit);
  };

  // `MOCK_DDL_EMPTY=1`: semua daftar pilihan kosong, supaya keadaan "belum ada
  // data wilayah" di dalam popup bisa dinilai lewat render.
  if (process.env.MOCK_DDL_EMPTY) return [];

  switch (name) {
    case "profession":
      return rowsOf(PROFESSIONS, "PRF");
    case "ethnic-group":
      return rowsOf(ETHNIC_GROUPS, "ETH");
    case "zone-church":
      return rowsOf(ZONE_CHURCHES, "ZON");
    case "keluarga":
      return narrow(keluargaDdl(params));
    case "jemaat":
      return narrow(DDL_JEMAAT);
    case "bapel":
      return rowsOf(BAPEL_NAMES, "BPL");
    case "role-user":
      return ROLE_USERS;
    case "provinces":
      return PROVINCES;
    case "regencies":
      return REGENCIES[params.get("provincesCode") ?? ""] ?? [UNKNOWN_ROW];
    case "districts":
      return DISTRICTS[params.get("regenciesCode") ?? ""] ?? [UNKNOWN_ROW];
    case "villages":
      return VILLAGES[params.get("districtsCode") ?? ""] ?? [UNKNOWN_ROW];
    default:
      return undefined;
  }
}
