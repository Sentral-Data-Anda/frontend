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
import { toDateKey } from "../src/features/beranda/time";

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

/** Masuk/keluar satu bulan (rupiah). Deterministik per bulan. */
const monthFlow = (month: number) => ({
  income: 70_000_000 + ((month * 7919) % 25) * 1_000_000,
  expense: 52_000_000 + ((month * 104_729) % 22) * 1_000_000,
});

export function surplusDefisit(from: string, to: string) {
  const month = Number(from.slice(5, 7));
  const flow = from > today() ? { income: 0, expense: 0 } : monthFlow(month);
  const income = [
    node(10, "4-0000", "Pendapatan", "INCOME", flow.income, [
      node(11, "4-1000", "Persembahan", "INCOME", flow.income * 0.8),
      node(12, "4-2000", "Pendapatan lain", "INCOME", flow.income * 0.2),
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
