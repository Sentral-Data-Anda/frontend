/**
 * Persona dan data dashboard untuk `dev:mock`. Hanya endpoint yang MEMANG ADA
 * di be-sada; bentuk respons disalin dari controller/repository-nya (rujukan
 * berkas di tiap fungsi). Widget yang endpoint-nya belum ada memakai fixture
 * FE di `src/features/beranda/dummy.ts`, bukan tiruan di sini.
 *
 *   MOCK_PERSONA=admin (bawaan) | sekretariat | bendahara | majelis
 *
 * `admin` = pohon menu lengkap dengan semua aksi (be-sada menyintesis aksi
 * untuk `isAdmin`) — dipakai untuk menilai sidebar 12 domain / 61 layar.
 */
import { MENU, type MenuSlug } from "../src/config/menu";
import { toDateKey } from "../src/features/beranda/model";

type Action = "VIEW" | "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT";

export type Persona = {
  roleName: string;
  isAdmin: boolean;
  jemaatName: string;
  /** null = semua layar, semua aksi. */
  grants: Partial<Record<MenuSlug, Action[]>> | null;
};

const V: Action[] = ["VIEW"];
const VC: Action[] = ["VIEW", "CREATE"];

export const PERSONAS: Record<string, Persona> = {
  // docs/design/dashboard-desktop.md §3e.
  sekretariat: {
    roleName: "Sekretariat",
    isAdmin: false,
    jemaatName: "Andreas Sitanggang",
    grants: {
      [MENU.DAFTAR_JEMAAT]: process.env.MOCK_NO_CREATE ? V : VC,
      [MENU.REPORT_JEMAAT]: V,
      [MENU.IBADAH]: VC,
      [MENU.JADWAL_PELAYAN]: V,
      [MENU.EVENT]: V,
      [MENU.PENGUMUMAN]: VC,
      [MENU.PEMINJAMAN_RUANG]: V,
    },
  },
  // §3b apa adanya (tanpa PERMINTAAN_PERSETUJUAN — "Menunggu tindakan saya
  // jika memegang izin"), plus IBADAH/EVENT VIEW supaya Agenda dan
  // "· 2 kebaktian" di rancangan §3b tampil.
  bendahara: {
    roleName: "Bendahara",
    isAdmin: false,
    jemaatName: "Maria Hutapea",
    grants: {
      [MENU.PERSEMBAHAN]: VC,
      [MENU.KAS_MASUK]: VC,
      [MENU.KAS_KELUAR]: VC,
      [MENU.JURNAL]: V,
      [MENU.AKUN]: V,
      [MENU.PERIODE_FISKAL]: V,
      [MENU.LAPORAN_KEUANGAN]: V,
      [MENU.FAKTUR_SUPPLIER]: V,
      [MENU.PEMBAYARAN]: V,
      [MENU.PAYROLL]: V,
      [MENU.IBADAH]: V,
      [MENU.EVENT]: V,
    },
  },
  // §3c, dengan LAPORAN_KEUANGAN (keputusan admin; tanpanya grid merapat).
  majelis: {
    roleName: "Majelis Jemaat",
    isAdmin: false,
    jemaatName: "Pdt. Yohanes Simatupang",
    grants: {
      [MENU.PERMINTAAN_PERSETUJUAN]: ["VIEW", "APPROVE", "REJECT"],
      [MENU.LAPORAN_KEUANGAN]: process.env.MOCK_MAJELIS_NO_FINANCE
        ? undefined
        : V,
      [MENU.PAGU_ANGGARAN]: V,
      [MENU.PROGRAM]: V,
      [MENU.LAPORAN_BUDGET]: V,
      [MENU.IBADAH]: V,
      [MENU.EVENT]: V,
      [MENU.REPORT_JEMAAT]: V,
    },
  },
  admin: {
    roleName: "Administrator",
    isAdmin: true,
    jemaatName: "Admin Sistem",
    grants: null,
  },
};

const ALL_ACTIONS: Action[] = [
  "VIEW",
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
];

export const actionsOf = (persona: Persona, slug: string): Action[] =>
  persona.grants === null
    ? ALL_ACTIONS
    : (persona.grants[slug as MenuSlug] ?? []);

/** Guard be-sada: `Authorization(MENU.X, "VIEW")`; admin melewatinya. */
export const GUARD: Record<string, MenuSlug> = {
  "/ibadah": MENU.IBADAH,
  "/event": MENU.EVENT,
  "/persetujuan": MENU.PERMINTAAN_PERSETUJUAN,
  "/laporan-keuangan/neraca": MENU.LAPORAN_KEUANGAN,
  "/laporan-keuangan/surplus-defisit": MENU.LAPORAN_KEUANGAN,
  "/kas-keluar": MENU.KAS_KELUAR,
  "/faktur-supplier": MENU.FAKTUR_SUPPLIER,
  "/pembayaran": MENU.PEMBAYARAN,
  "/payroll": MENU.PAYROLL,
  "/periode-fiskal": MENU.PERIODE_FISKAL,
  "/jurnal": MENU.JURNAL,
  "/loan-room": MENU.PEMINJAMAN_RUANG,
  "/jemaat": MENU.DAFTAR_JEMAAT,
};

export const guardSlugOf = (path: string): MenuSlug | undefined =>
  path.startsWith("/report/jemaat/") ? MENU.REPORT_JEMAAT : GUARD[path];

// ---------------------------------------------------------------------------
// Tanggal (WIB). "Hari ini" = hari mock dijalankan, jadi Beranda selalu terisi.

const today = () => toDateKey(new Date());

export const addDays = (key: string, days: number): string => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const iso = (key: string) => `${key}T00:00:00.000Z`;

const dayOfWeek = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay();

const audit = {
  createdBy: 3,
  createdAt: "2026-09-01T02:00:00.000Z",
  updatedBy: null,
  updatedAt: null,
  deletedBy: null,
  deletedAt: null,
};

// ---------------------------------------------------------------------------
// GET /ibadah — `ibadah.repository.ts:6-35`. `date` persis, atau
// `startDate` + `endDate` (keduanya wajib, inklusif per hari).

const ibadahRow = (
  id: number,
  dateKey: string,
  startTime: string,
  endTime: string,
  preacher: string | null,
  typeName: string,
) => ({
  id,
  publicId: `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`,
  code: `IBD-${String(id).padStart(4, "0")}`,
  date: iso(dateKey),
  startTime,
  endTime,
  theme: null,
  bibleVerse: null,
  preacher,
  maleCount: 0,
  femaleCount: 0,
  childCount: 0,
  note: null,
  ...audit,
  typeIbadah: { id: 1, code: "TI-1", name: typeName },
  room: { id: 1, code: "R-01", name: "Gedung Gereja" },
  bapel: null,
  jadwalPelayan: null,
});

/**
 * Hari ini: dua ibadah Minggu (bentuk Beranda yang sudah di-review, apa pun
 * harinya). Minggu lain: dua ibadah; Rabu: persekutuan doa.
 */
const ibadahOn = (key: string, seed: number) => {
  if (process.env.MOCK_NO_IBADAH) return [];
  if (key === today() || dayOfWeek(key) === 0) {
    return [
      ibadahRow(seed + 2, key, "17:00", "18:30", null, "Ibadah Minggu II"),
      ibadahRow(
        seed + 1,
        key,
        "08:00",
        "09:30",
        "Pdt. Yohanes Simatupang",
        "Ibadah Minggu I",
      ),
    ];
  }
  if (dayOfWeek(key) === 3) {
    return [
      ibadahRow(seed + 3, key, "19:00", "20:30", null, "Persekutuan Doa"),
    ];
  }
  return [];
};

export function listIbadah(params: URLSearchParams) {
  const date = params.get("date");
  const start = params.get("startDate");
  const end = params.get("endDate");
  const keys = date
    ? [date]
    : start && end
      ? Array.from({ length: 62 }, (_, i) => addDays(start, i)).filter(
          (key) => key <= end,
        )
      : Array.from({ length: 14 }, (_, i) => addDays(today(), i - 7));

  // Urutan be-sada: date desc, startTime desc.
  return keys
    .flatMap((key, index) => ibadahOn(key, index * 10))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
    );
}

// ---------------------------------------------------------------------------
// GET /event — `event.repository.ts:47-62`. Tanggal saja (tanpa jam);
// `startDate` + `endDate` = CONTAINMENT (acara harus seluruhnya di dalam
// rentang), urut `startDate asc`.

const eventRow = (
  id: number,
  name: string,
  from: number,
  to: number,
  bapel: string,
  room: string | null,
) => ({
  id,
  publicId: `00000000-0000-4000-9000-${String(id).padStart(12, "0")}`,
  code: `EVT-${String(id).padStart(4, "0")}`,
  name,
  description: null,
  isIndoor: room !== null,
  location: room ? null : "Parapat",
  capacity: 100,
  isPaid: false,
  price: null,
  startDate: iso(addDays(today(), from)),
  endDate: iso(addDays(today(), to)),
  urlForm: null,
  isPublish: true,
  programId: null,
  ...audit,
  bapel: { id, code: `BPL-00${id}`, name: bapel },
  room: room ? { id, code: `R-0${id}`, name: room } : null,
  image: null,
});

export function listEvent(params: URLSearchParams) {
  const rows = [
    eventRow(1, "Rapat Majelis", 1, 1, "Majelis Jemaat", "Ruang Konsistori"),
    eventRow(2, "Retret Pemuda", 2, 4, "Komisi Pemuda", null),
    eventRow(3, "Latihan Paduan Suara", 3, 3, "Komisi Musik", "Aula"),
    eventRow(4, "Bazar Natal", 5, 5, "Komisi Wanita", "Halaman Gereja"),
  ];
  const start = params.get("startDate");
  const end = params.get("endDate");

  if (!start || !end) return rows;

  return rows.filter(
    (row) => row.startDate >= iso(start) && row.endDate <= iso(end),
  );
}

// ---------------------------------------------------------------------------
// GET /persetujuan?menunggu=saya — `persetujuan.repository.ts:46-64, 114-165`.
// Tanpa nama pengaju dan tanpa nomor dokumen: hanya `documentType` +
// `documentId`. Urut `submittedAt asc` (paling lama menunggu dulu).

const approval = (
  id: number,
  documentType: string,
  amount: number,
  daysAgo: number,
  bapel: string,
) => ({
  id,
  publicId: `00000000-0000-4000-a000-${String(id).padStart(12, "0")}`,
  code: `PST-2026-${String(id).padStart(4, "0")}`,
  documentType,
  documentId: 40 + id,
  configId: 3,
  amount: String(amount),
  status: "PENDING",
  currentOrder: 1,
  submittedBy: 12,
  submittedAt: `${addDays(today(), -daysAgo)}T03:10:00.000Z`,
  completedAt: null,
  createdAt: `${addDays(today(), -daysAgo)}T03:10:00.000Z`,
  updatedAt: null,
  config: { publicId: "cfg-3", name: "Persetujuan Majelis" },
  steps: [
    {
      publicId: `step-${id}`,
      order: 1,
      approverRoleUserId: null,
      approverRoleName: "Ketua",
      approverBapelId: 4,
      status: "PENDING",
      note: null,
      actedBy: null,
      actedAt: null,
      approverRoleUser: null,
      approverBapel: { publicId: "bpl-4", code: "BPL-004", name: bapel },
    },
  ],
});

export function listWaitingApprovals() {
  if (process.env.MOCK_NO_APPROVAL) return [];
  return [
    approval(19, "PROGRAM", 12_000_000, 5, "Komisi Wanita"),
    approval(20, "LOAN_ROOM", 0, 3, "Komisi Musik"),
    approval(21, "CASH_EXPENSE", 4_500_000, 2, "Komisi Pemuda"),
  ];
}

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
      code: `PSB-${String(50 - index).padStart(4, "0")}`,
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
// GET /public/announcement — `public.service.ts:8-16, 112-125`. Tanpa sesi,
// hanya `limit`, tanpa totalData/totalPage, 200 `[]` bila kosong.

export function listPublicAnnouncements(limit: number) {
  const rows = [
    ["Warta Jemaat Minggu Ini", "WARTA", 0, true],
    ["Retret Pemuda 2026", "KEGIATAN", -2, false],
    ["Perubahan jam Ibadah Minggu II", "PENGUMUMAN", -4, false],
    ["Ucapan syukur Keluarga Manurung", "UCAPAN_SYUKUR", -6, false],
    ["Berita duka: Bpk. Gideon Tampubolon", "BERITA_DUKA", -9, false],
  ] as const;

  return rows
    .map(([title, category, days, isPinned], index) => ({
      id: `00000000-0000-4000-b000-${String(index + 1).padStart(12, "0")}`,
      category,
      title,
      content: "…",
      publishDate: iso(addDays(today(), days)),
      isPinned,
      files: [],
    }))
    .slice(0, limit);
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
// GET /loan-room — `loan_room.repository.ts:30-57`. TIDAK ada filter status;
// `date` atau `startDate` + `endDate`; urut `date asc, startTime asc`.

const loanRoom = (
  id: number,
  days: number,
  startTime: string,
  endTime: string,
  purpose: string,
  status: string,
  room: string,
  bapel: string,
  borrower: string,
) => ({
  id,
  publicId: `lr-${id}`,
  code: `LRM-2026-${String(id).padStart(4, "0")}`,
  date: iso(addDays(today(), days)),
  startTime,
  endTime,
  purpose,
  status,
  ...audit,
  bapel: { code: "BPL-00" + id, name: bapel },
  room: { code: "R-0" + id, name: room, image: [] },
  jemaat: { code: "JMT-000" + id, name: borrower, gender: "P" },
});

export function listLoanRoom(params: URLSearchParams) {
  const rows = [
    loanRoom(
      1,
      0,
      "18:00",
      "20:00",
      "Latihan paduan suara",
      "APPROVED",
      "Aula",
      "Komisi Musik",
      "Sari Lubis",
    ),
    loanRoom(
      2,
      2,
      "10:00",
      "12:00",
      "Rapat pengurus",
      "PENDING",
      "Ruang Konsistori",
      "Komisi Wanita",
      "Debora Manurung",
    ),
    loanRoom(
      3,
      4,
      "16:00",
      "18:00",
      "Kelas katekisasi",
      "PENDING",
      "Ruang Kelas 2",
      "Komisi Pemuda",
      "Fransiska Halim",
    ),
    loanRoom(
      4,
      6,
      "09:00",
      "13:00",
      "Pernikahan",
      "PENDING",
      "Gedung Gereja",
      "Majelis Jemaat",
      "Lidya Hutagalung",
    ),
  ];
  const date = params.get("date");
  const start = params.get("startDate");
  const end = params.get("endDate");

  return rows.filter((row) =>
    date
      ? row.date === iso(date)
      : start && end
        ? row.date >= iso(start) && row.date <= iso(end)
        : true,
  );
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
  code: `INV-2026-${String(id).padStart(4, "0")}`,
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
  code: `PAY-2026-${String(id).padStart(4, "0")}`,
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
// GET /payroll — `payroll.repository.ts:41-46`, tanpa relasi, urut tahun &
// bulan menurun. Tidak ada jumlah karyawan di daftar.

export function listPayrolls(params: URLSearchParams) {
  const month = Number(today().slice(5, 7));
  const year = Number(today().slice(0, 4));
  const rows = [
    {
      id: 9,
      publicId: "pyr-9",
      code: "PYR-2026-0009",
      year,
      month,
      status: "DRAFT",
      totalGross: "45000000",
      totalDeduction: "2500000",
      totalNet: "5200000",
      approvedBy: null,
      approvedAt: null,
      paidAt: null,
      createdBy: 1,
      createdAt: `${addDays(today(), -6)}T02:00:00.000Z`,
      updatedBy: null,
      updatedAt: null,
    },
    {
      id: 8,
      publicId: "pyr-8",
      code: "PYR-2026-0008",
      year,
      month: month === 1 ? 12 : month - 1,
      status: "PAID",
      totalGross: "44000000",
      totalDeduction: "2400000",
      totalNet: "41600000",
      approvedBy: 1,
      approvedAt: `${addDays(today(), -30)}T02:00:00.000Z`,
      paidAt: `${addDays(today(), -28)}T02:00:00.000Z`,
      createdBy: 1,
      createdAt: `${addDays(today(), -36)}T02:00:00.000Z`,
      updatedBy: null,
      updatedAt: null,
    },
  ];
  const status = params.get("status");

  return status ? rows.filter((row) => row.status === status) : rows;
}

// ---------------------------------------------------------------------------
// GET /periode-fiskal — `periode_fiskal.service.ts:74-99`: `id` = publicId,
// `label` "September 2026", tanpa `code`/`name`. Urut tahun menurun, bulan naik.

const MONTH_LABEL = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function listFiscalPeriods(params: URLSearchParams) {
  const year = Number(today().slice(0, 4));
  const month = Number(today().slice(5, 7));
  const rows = Array.from({ length: 12 }, (_, index) => {
    const m = index + 1;
    return {
      id: `fp-${year}-${m}`,
      year,
      month: m,
      label: `${MONTH_LABEL[index]} ${year}`,
      status: m < month ? "CLOSED" : "OPEN",
      startDate: iso(`${year}-${String(m).padStart(2, "0")}-01`),
      endDate: iso(`${year}-${String(m).padStart(2, "0")}-28`),
      closedBy: m < month ? 1 : null,
      closedAt:
        m < month ? iso(`${year}-${String(m).padStart(2, "0")}-28`) : null,
      reopenedBy: null,
      reopenedAt: null,
      reopenReason: null,
    };
  });
  const status = params.get("status");

  return ["OPEN", "CLOSED"].includes(status ?? "")
    ? rows.filter((row) => row.status === status)
    : rows;
}

// ---------------------------------------------------------------------------
// GET /jurnal — `jurnal.repository.ts:6-68`. Total dihitung dari `lines`.

export function listJournals(params: URLSearchParams) {
  const rows = [1, 2].map((index) => ({
    id: 20 + index,
    publicId: `jrn-${index}`,
    code: `JRN-2026-00${20 + index}`,
    entryDate: iso(addDays(today(), -index * 2)),
    description: index === 1 ? "Biaya listrik September" : "Koreksi kas kecil",
    status: "DRAFT",
    sourceType: "MANUAL",
    sourceId: null,
    fiscalPeriodId: 9,
    reversalOfId: null,
    postedBy: null,
    postedAt: null,
    ...audit,
    fiscalPeriod: {
      year: Number(today().slice(0, 4)),
      month: Number(today().slice(5, 7)),
      status: "OPEN",
    },
    lines: [],
  }));
  const status = params.get("status");

  return ["DRAFT", "POSTED", "REVERSED"].includes(status ?? "")
    ? rows.filter((row) => row.status === status)
    : rows;
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
const PROFESSIONS = [
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

const ETHNIC_GROUPS = [
  "Batak Toba",
  "Batak Karo",
  "Jawa",
  "Minahasa",
  "Nias",
  "Sunda",
  "Tionghoa",
  "Timor",
];

const ZONE_CHURCHES = ["Wilayah I", "Wilayah II", "Wilayah III", "Wilayah IV"];

const rowsOf = (names: string[], prefix: string) =>
  names.map((name, index) => ({
    id: index + 1,
    code: `${prefix}-${index + 1}`,
    name,
  }));

/**
 * `MOCK_DDL_MANY=1` membesarkan daftar keluarga ke 400 baris: itu ukuran yang
 * membuat combobox harus benar-benar menyaring, dan yang menunjukkan kenapa
 * `?filter=` di be-sada (B9) dibutuhkan.
 */
const KELUARGA_COUNT = process.env.MOCK_DDL_MANY ? 400 : 24;

const KELUARGA = Array.from({ length: KELUARGA_COUNT }, (_, index) => ({
  id: index + 1,
  code: `KEL-${String(index + 1).padStart(4, "0")}`,
  name: `Keluarga ${["Sitanggang", "Kusuma", "Wijaya", "Manurung", "Panggabean", "Halim", "Saragih", "Nainggolan"][index % 8]} ${index + 1}`,
}));

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
      return narrow(KELUARGA);
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
