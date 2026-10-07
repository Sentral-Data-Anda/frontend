/**
 * Tiruan `/api/v1/persetujuan` (be-sada modul `persetujuan`, cabang `persetujuan-fe-gaps`):
 * tiga bacaan daftar, detail dengan `canSign`/`canWithdraw`, dan setujui/tolak/tarik.
 *
 *   MOCK_EMPTY=1                  → ketiga daftar kosong (404)
 *   MOCK_500=1                    → ketiga daftar menjawab 500
 *   MOCK_APPROVAL_MANY=1          → +150 permintaan menunggu role persona (paginasi)
 *   MOCK_APPROVAL_ACT_ERROR=500   → setujui/tolak/tarik menjawab 500
 *   MOCK_APPROVAL_RACE=1          → aksi pertama menjawab 400 "… Sudah Selesai"
 *
 * Permintaan `ASSET_DISPOSAL` dibaca dari store Inventaris (pelepasan barang) dan
 * `PURCHASE_REQUEST` dari store Pengadaan; keputusan akhirnya ditulis balik lewat
 * `decideDisposal` / `decidePurchaseRequest`. Tahap permintaan pembelian: Bendahara,
 * ditambah Majelis bila nominal di atas Rp10 juta.
 *
 * "Saya" = SESSION_USER_ID (satu akun untuk semua persona), jadi Pengajuan dan Riwayat
 * sama di semua persona; antrean dan hak tanda tangan berbeda lewat role dan jabatan.
 */
import { MENU } from "../../../src/config/menu";
import {
  APPROVAL_DOCUMENT_TYPES,
  APPROVAL_STATUSES,
  type ApprovalDocumentType,
  type ApprovalStatus,
} from "../../../src/types/persetujuan";
import {
  PERSONA_KEY,
  PERSONA_POSITIONS,
  ROLE_USERS,
  SESSION_USER_ID,
  currentPersona,
} from "../../mock-dashboard";
import {
  ASSET,
  DISPOSAL,
  TODAY,
  decideDisposal,
  type DisposalMethod,
  type DisposalRow,
} from "../inventaris-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  PURCHASE_REQUEST,
  decidePurchaseRequest,
  requestTotalIdr,
  type ApprovalRef,
  type PurchaseRequestRow,
} from "../pengadaan-store";

type StepStatus = Exclude<ApprovalStatus, "CANCELLED">;

type Step = {
  publicId: string;
  order: number;
  approverRoleUserId: number | null;
  approverRoleName: string | null;
  approverBapelId: number | null;
  status: StepStatus;
  note: string | null;
  actedBy: number | null;
  actedAt: string | null;
};

type Row = {
  id: number;
  publicId: string;
  code: string;
  documentType: ApprovalDocumentType;
  amount: string;
  status: ApprovalStatus;
  currentOrder: number;
  submittedBy: number;
  submittedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  config: { publicId: string; name: string } | null;
  document: { publicId: string; code: string; title: string } | null;
  steps: Step[];
};

type Tier = { role: number } | { position: string; bapelId: number };

type Act = {
  status: StepStatus;
  by?: number;
  note?: string;
  hoursAgo?: number;
};

const BAPELS = [
  "Majelis Jemaat",
  "Komisi Pemuda",
  "Komisi Wanita",
  "Komisi Anak",
  "Komisi Musik",
  "Komisi Diakonia",
].map((name, index) => ({
  id: index + 1,
  publicId: `bapel-${index + 1}`,
  code: `BPL-${index + 1}`,
  name,
}));

const OTHER_USERS: Record<number, string> = {
  11: "Rina Situmorang",
  12: "Daniel Panjaitan",
  13: "Pnt. Hotman Sinaga",
  14: "Ester Manurung",
  15: "Pnt. Rudolf Nainggolan",
  16: "Samuel Lumbantobing",
};

const CONFIGS: Record<ApprovalDocumentType, string> = {
  PURCHASE_REQUEST: "Pembelian barang komisi",
  PROGRAM: "Program tahunan",
  PROGRAM_MENDADAK: "Program mendadak",
  BUDGET_USAGE_REPORT: "Laporan pemakaian anggaran",
  CASH_EXPENSE: "Kas keluar di atas Rp 1 juta",
  LEAVE_REQUEST: "Cuti karyawan",
  PAYROLL_RUN: "Penggajian bulanan",
  PURCHASE_RETURN: "Retur pembelian",
  LOAN_ROOM: "Peminjaman ruang (lama)",
  ASSET_DISPOSAL: "Pelepasan barang",
};

const DISPOSAL_METHOD_LABEL: Record<DisposalMethod, string> = {
  SOLD: "Dijual",
  SCRAPPED: "Dimusnahkan",
  DONATED: "Dihibahkan",
  LOST: "Hilang",
};

const NOT_FOUND = "Permintaan Persetujuan Tidak Ditemukan";
const LIST_MESSAGE = "Berhasil Mendapatkan Permintaan Persetujuan";

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

const pad = (value: number, size: number) => String(value).padStart(size, "0");

const makeRow = (
  id: number,
  spec: {
    type: ApprovalDocumentType;
    amount: number;
    by: number;
    daysAgo: number;
    tiers: Tier[];
    acts?: Act[];
    title?: string | null;
    isCancelled?: boolean;
  },
): Row => {
  const submittedAt = hoursAgo(spec.daysAgo * 24 + 2);
  const acts = spec.acts ?? [];
  const steps: Step[] = spec.tiers.map((tier, index) => {
    const act = acts[index];
    const position =
      "position" in tier
        ? { approverRoleName: tier.position, approverBapelId: tier.bapelId }
        : { approverRoleName: null, approverBapelId: null };

    return {
      publicId: `pst-step-${id}-${index + 1}`,
      order: index + 1,
      approverRoleUserId: "role" in tier ? tier.role : null,
      ...position,
      status: act?.status ?? "PENDING",
      note: act?.note ?? null,
      actedBy: act ? (act.by ?? SESSION_USER_ID) : null,
      actedAt: act
        ? hoursAgo(act.hoursAgo ?? spec.daysAgo * 24 - index - 1)
        : null,
    };
  });
  const rejected = steps.find((step) => step.status === "REJECTED");
  const pending = steps.find((step) => step.status === "PENDING");
  const status: ApprovalStatus = spec.isCancelled
    ? "CANCELLED"
    : rejected
      ? "REJECTED"
      : pending
        ? "PENDING"
        : "APPROVED";
  const lastActed = steps
    .map((step) => step.actedAt)
    .filter((value) => value !== null)
    .sort()
    .at(-1);
  const completedAt =
    status === "PENDING"
      ? null
      : status === "CANCELLED"
        ? hoursAgo(spec.daysAgo * 24 - 3)
        : (lastActed ?? null);
  const code = `PST-${TODAY.slice(0, 4)}-${pad(id, 4)}`;

  return {
    id,
    publicId: `0b5e7a00-0000-4000-a000-${pad(id, 12)}`,
    code,
    documentType: spec.type,
    amount: String(spec.amount),
    status,
    currentOrder: (rejected ?? pending ?? steps.at(-1))?.order ?? 1,
    submittedBy: spec.by,
    submittedAt,
    completedAt,
    createdAt: submittedAt,
    updatedAt: completedAt ?? lastActed ?? null,
    config: {
      publicId: `cfg-${spec.type.toLowerCase()}`,
      name: CONFIGS[spec.type],
    },
    document:
      spec.title === null
        ? null
        : {
            publicId: `doc-${id}`,
            code: `${spec.type.slice(0, 3)}-2026-${pad(id * 7, 4)}`,
            title: spec.title ?? CONFIGS[spec.type],
          },
    steps,
  };
};

const ME = SESSION_USER_ID;
const BENDAHARA = { role: 4 };
const MAJELIS = { role: 5 };
const SEKRETARIAT = { role: 2 };
const KETUA_MAJELIS = { position: "Ketua", bapelId: 1 };
const KETUA_WANITA = { position: "Ketua", bapelId: 3 };
const SEKRETARIS_PEMUDA = { position: "Sekretaris", bapelId: 2 };

const seed = (): Row[] => [
  makeRow(1, {
    type: "PROGRAM",
    amount: 12_000_000,
    by: 13,
    daysAgo: 5,
    tiers: [KETUA_MAJELIS],
    title: "Retret Pemuda Parapat 2026",
  }),
  makeRow(2, {
    type: "CASH_EXPENSE",
    amount: 4_500_000,
    by: 12,
    daysAgo: 3,
    tiers: [BENDAHARA, MAJELIS],
    acts: [{ status: "APPROVED", by: 15 }],
    title: "Konsumsi rapat majelis Oktober",
  }),
  makeRow(3, {
    type: "LEAVE_REQUEST",
    amount: 3,
    by: 11,
    daysAgo: 2,
    tiers: [MAJELIS],
    title: "Rina Situmorang · Cuti Tahunan · 3 hari",
  }),
  makeRow(5, {
    type: "BUDGET_USAGE_REPORT",
    amount: 8_200_000,
    by: 16,
    daysAgo: 0,
    tiers: [KETUA_MAJELIS, BENDAHARA],
    title: "Komisi Pemuda · 08/2026",
  }),
  makeRow(6, {
    type: "PROGRAM_MENDADAK",
    amount: 1_500_000,
    by: 12,
    daysAgo: 8,
    tiers: [MAJELIS],
    title: null,
  }),
  makeRow(7, {
    type: "CASH_EXPENSE",
    amount: 3_200_000,
    by: ME,
    daysAgo: 1,
    tiers: [MAJELIS],
    title: "Perbaikan pompa air gedung serbaguna",
  }),
  makeRow(8, {
    type: "PAYROLL_RUN",
    amount: 45_000_000,
    by: ME,
    daysAgo: 12,
    tiers: [BENDAHARA, MAJELIS, KETUA_MAJELIS],
    acts: [
      { status: "APPROVED", by: 15 },
      {
        status: "REJECTED",
        by: 13,
        note: "Tunjangan transport koster bulan ini dihitung dua kali. Mohon perbaiki rincian penggajian lalu ajukan ulang.",
      },
    ],
    title: "Penggajian 09/2026",
  }),
  makeRow(9, {
    type: "PURCHASE_RETURN",
    amount: 950_000,
    by: ME,
    daysAgo: 20,
    tiers: [MAJELIS, BENDAHARA],
    acts: [
      { status: "APPROVED", by: 13 },
      { status: "APPROVED", by: 15 },
    ],
    title: "CV Sinar Terang · Proyektor rusak saat diterima",
  }),
  makeRow(10, {
    type: "PROGRAM",
    amount: 6_000_000,
    by: ME,
    daysAgo: 15,
    tiers: [MAJELIS],
    title: "Pelatihan multimedia pelayan ibadah",
    isCancelled: true,
  }),
  makeRow(11, {
    type: "CASH_EXPENSE",
    amount: 780_000,
    by: ME,
    daysAgo: 0,
    tiers: [BENDAHARA, MAJELIS],
    title: "Pembelian alat tulis sekretariat",
  }),
  makeRow(12, {
    type: "BUDGET_USAGE_REPORT",
    amount: 5_400_000,
    by: ME,
    daysAgo: 4,
    tiers: [SEKRETARIS_PEMUDA],
    title: "Komisi Pemuda · 07/2026",
  }),
  makeRow(13, {
    type: "CASH_EXPENSE",
    amount: 2_100_000,
    by: 14,
    daysAgo: 4,
    tiers: [BENDAHARA],
    title: "Honor pemusik tamu Minggu Pemuda",
  }),
  makeRow(15, {
    type: "PAYROLL_RUN",
    amount: 48_500_000,
    by: 12,
    daysAgo: 0,
    tiers: [BENDAHARA, MAJELIS],
    title: "Penggajian 10/2026",
  }),
  makeRow(17, {
    type: "CASH_EXPENSE",
    amount: 1_250_000,
    by: 14,
    daysAgo: 10,
    tiers: [MAJELIS],
    acts: [{ status: "APPROVED" }],
    title: "Bunga dan dekorasi Minggu Syukur",
  }),
  makeRow(18, {
    type: "PROGRAM",
    amount: 9_800_000,
    by: 13,
    daysAgo: 9,
    tiers: [KETUA_MAJELIS],
    acts: [
      {
        status: "REJECTED",
        note: "Anggaran konsumsi terlalu besar untuk 40 peserta. Mohon rinci ulang per pos.",
      },
    ],
    title: "Kemah Sekolah Minggu",
  }),
  makeRow(19, {
    type: "CASH_EXPENSE",
    amount: 7_300_000,
    by: 16,
    daysAgo: 7,
    tiers: [MAJELIS, BENDAHARA],
    acts: [
      { status: "APPROVED", hoursAgo: 150 },
      {
        status: "REJECTED",
        by: 15,
        hoursAgo: 100,
        note: "Kas komisi belum cukup bulan ini. Ajukan kembali awal bulan depan.",
      },
    ],
    title: "Sewa tenda retret pemuda",
  }),
  makeRow(20, {
    type: "LEAVE_REQUEST",
    amount: 2,
    by: 11,
    daysAgo: 1,
    tiers: [MAJELIS, BENDAHARA],
    acts: [{ status: "APPROVED", hoursAgo: 12 }],
    title: "Rina Situmorang · Cuti Sakit · 2 hari",
  }),
  makeRow(21, {
    type: "PROGRAM",
    amount: 4_000_000,
    by: 16,
    daysAgo: 6,
    tiers: [KETUA_WANITA],
    title: "Seminar Keluarga Kristen",
  }),
  makeRow(22, {
    type: "CASH_EXPENSE",
    amount: 3_600_000,
    by: 12,
    daysAgo: 25,
    tiers: [BENDAHARA, MAJELIS],
    acts: [
      { status: "APPROVED", by: 15 },
      { status: "APPROVED", by: 13 },
    ],
    title: "Servis pendingin ruang ibadah",
  }),
  makeRow(23, {
    type: "PURCHASE_RETURN",
    amount: 420_000,
    by: 14,
    daysAgo: 18,
    tiers: [MAJELIS],
    title: "Toko Buku Immanuel · Salah cetak",
    isCancelled: true,
  }),
  makeRow(24, {
    type: "BUDGET_USAGE_REPORT",
    amount: 2_300_000,
    by: 12,
    daysAgo: 2,
    tiers: [SEKRETARIAT],
    title: "Komisi Diakonia · 08/2026",
  }),
];

const disposalRow = (
  disposal: DisposalRow,
  approval: { id: number; publicId: string; code: string },
): Row => {
  const target = ASSET.find((item) => item.id === disposal.assetId);
  const daysAgo = Math.max(
    0,
    Math.round(
      (Date.parse(TODAY) - Date.parse(disposal.disposalDate)) / 86_400_000,
    ),
  );
  const row = makeRow(approval.id, {
    type: "ASSET_DISPOSAL",
    amount: target?.acquisitionCost ?? 0,
    by: disposal.submittedBy,
    daysAgo,
    tiers: [BENDAHARA],
    acts:
      disposal.status === "APPROVED"
        ? [{ status: "APPROVED", by: 15 }]
        : disposal.status === "REJECTED"
          ? [
              {
                status: "REJECTED",
                by: 15,
                note: disposal.rejectionNote ?? "Pelepasan ditolak.",
              },
            ]
          : [],
    title: `${target?.code ?? "-"} · ${target?.name ?? "-"} · ${DISPOSAL_METHOD_LABEL[disposal.method]}`,
    isCancelled: disposal.status === "CANCELLED",
  });

  return {
    ...row,
    publicId: approval.publicId,
    code: approval.code,
    document: row.document ? { ...row.document, code: disposal.code } : null,
  };
};

const LARGE_PURCHASE = 10_000_000;

const purchaseRequestRow = (
  request: PurchaseRequestRow,
  approval: ApprovalRef,
): Row => {
  const amount = requestTotalIdr(request);
  const daysAgo = Math.max(
    0,
    Math.round(
      (Date.parse(TODAY) - Date.parse(approval.submittedAt.slice(0, 10))) /
        86_400_000,
    ),
  );
  const bapel = BAPELS.find((item) => item.id === request.bapelId);
  const tiers = amount > LARGE_PURCHASE ? [BENDAHARA, MAJELIS] : [BENDAHARA];
  const acts: Act[] =
    approval.status === "APPROVED"
      ? tiers.map(() => ({ status: "APPROVED", by: 15 }))
      : approval.status === "REJECTED"
        ? [
            {
              status: "REJECTED",
              by: 15,
              note: approval.note ?? "Permintaan ditolak.",
            },
          ]
        : [];
  const title = `${bapel?.name ?? "-"} · ${request.purpose}`;
  const row = makeRow(approval.id, {
    type: "PURCHASE_REQUEST",
    amount,
    by: approval.submittedBy,
    daysAgo,
    tiers,
    acts,
    title,
    isCancelled: approval.status === "CANCELLED",
  });

  return {
    ...row,
    publicId: approval.publicId,
    code: approval.code,
    document: { publicId: request.publicId, code: request.code, title },
  };
};

const many = (roleUserId: number): Row[] =>
  Array.from({ length: 150 }, (_, index) =>
    makeRow(100 + index, {
      type: APPROVAL_DOCUMENT_TYPES[index % 8],
      amount: index % 8 === 5 ? 1 + (index % 5) : 500_000 + index * 125_000,
      by: 11 + (index % 6),
      daysAgo: 30 - (index % 30),
      tiers: [{ role: roleUserId }],
      title: `Pengajuan contoh ${index + 1}`,
    }),
  );

export type MockApprover = {
  roleUserId: number;
  positions: readonly { name: string; bapelId: number }[];
  jemaatName: string;
};

// Identitas penanda tangan disuntikkan supaya test bisa memakai persona lain dengan state segar.
export const createPermintaanPersetujuanMock = (
  me: MockApprover,
): MockHandler => {
  const myRoleUserId = me.roleUserId;
  const myPositions = me.positions;
  const rows: Row[] = [
    ...seed(),
    ...(process.env.MOCK_APPROVAL_MANY ? many(myRoleUserId) : []),
  ];

  let isRaceArmed = Boolean(process.env.MOCK_APPROVAL_RACE);

  const syncDisposals = () => {
    for (const disposal of DISPOSAL) {
      const approval = disposal.approval;
      if (!approval) continue;

      const existing = rows.find((row) => row.publicId === approval.publicId);
      if (!existing) {
        rows.push(disposalRow(disposal, approval));
        continue;
      }
      if (existing.status === "PENDING" && disposal.status === "CANCELLED") {
        const now = new Date().toISOString();
        Object.assign(existing, {
          status: "CANCELLED",
          completedAt: now,
          updatedAt: now,
        });
      }
    }
  };

  const syncPurchaseRequests = () => {
    for (const request of PURCHASE_REQUEST) {
      for (const approval of request.approvals) {
        const existing = rows.find((row) => row.publicId === approval.publicId);
        if (!existing) {
          rows.push(purchaseRequestRow(request, approval));
          continue;
        }
        if (existing.status === "PENDING" && approval.status === "CANCELLED") {
          const now = new Date().toISOString();
          Object.assign(existing, {
            status: "CANCELLED",
            completedAt: now,
            updatedAt: now,
          });
        }
      }
    }
  };

  const writeBack = (row: Row, note: string | null = null) => {
    if (row.status === "PENDING") return;
    if (row.documentType === "ASSET_DISPOSAL") {
      decideDisposal(row.publicId, row.status, note);
    }
    if (row.documentType === "PURCHASE_REQUEST") {
      decidePurchaseRequest(row.publicId, row.status, note);
    }
  };

  const normalise = (name: string) => name.trim().toLowerCase();

  // approvalApprover.canSign be-sada.
  const canSignStep = (step: Step) => {
    if (step.approverRoleUserId !== null) {
      return step.approverRoleUserId === myRoleUserId;
    }
    if (step.approverRoleName === null || step.approverBapelId === null) {
      return false;
    }

    const wanted = normalise(step.approverRoleName);

    return myPositions.some(
      (held) =>
        held.bapelId === step.approverBapelId &&
        normalise(held.name) === wanted,
    );
  };

  const nameOf = (userId: number | null) => {
    if (userId === null) return null;
    const name = userId === ME ? me.jemaatName : OTHER_USERS[userId];

    return name ? { name } : null;
  };

  const roleUserOf = (id: number | null) => {
    const role = ROLE_USERS.find((item) => item.id === id);

    return role ? { publicId: `role-user-${role.id}`, name: role.name } : null;
  };

  const bapelOf = (id: number | null) => {
    const bapel = BAPELS.find((item) => item.id === id);

    return bapel
      ? { publicId: bapel.publicId, code: bapel.code, name: bapel.name }
      : null;
  };

  const present = (row: Row) => ({
    publicId: row.publicId,
    code: row.code,
    documentType: row.documentType,
    amount: row.amount,
    status: row.status,
    currentOrder: row.currentOrder,
    submittedAt: row.submittedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    config: row.config,
    document: row.document,
    submitter: nameOf(row.submittedBy),
    steps: row.steps.map((step) => ({
      publicId: step.publicId,
      order: step.order,
      approverRoleName: step.approverRoleName,
      approverRoleUser: roleUserOf(step.approverRoleUserId),
      approverBapel: bapelOf(step.approverBapelId),
      status: step.status,
      note: step.note,
      actedAt: step.actedAt,
      actor: nameOf(step.actedBy),
    })),
  });

  const fail = (status: number, error: string) =>
    json({ status, error }, status);

  // Urutan guard persetujuan.service `actionableStep`.
  const actionable = (row: Row) => {
    if (row.status !== "PENDING") {
      return { failure: fail(400, "Permintaan Persetujuan Ini Sudah Selesai") };
    }

    const step = row.steps.find((one) => one.order === row.currentOrder);
    if (!step)
      return { failure: fail(404, "Tahapan Persetujuan Tidak Ditemukan") };
    if (step.status !== "PENDING") {
      return { failure: fail(400, "Tahapan Persetujuan Ini Sudah Diproses") };
    }
    if (row.submittedBy === ME) {
      return {
        failure: fail(
          403,
          "Pengaju Tidak Dapat Menyetujui Permintaannya Sendiri",
        ),
      };
    }
    if (!canSignStep(step)) {
      return {
        failure: fail(
          403,
          step.approverRoleName === null
            ? "Tahapan Persetujuan Ini Bukan Wewenang Role Anda"
            : `Tahapan Persetujuan Ini Menunggu Tanda Tangan ${step.approverRoleName} Komisi Terkait`,
        ),
      };
    }

    return { step };
  };

  const withdrawable = (row: Row) => {
    if (row.status !== "PENDING") {
      return fail(400, "Permintaan Persetujuan Ini Sudah Selesai");
    }
    if (row.submittedBy !== ME) {
      return fail(403, "Hanya Pengaju Yang Dapat Menarik Permintaan Ini");
    }

    return null;
  };

  const mayRead = (row: Row, isAdmin: boolean) =>
    isAdmin ||
    row.submittedBy === ME ||
    row.steps.some((step) => step.actedBy === ME || canSignStep(step));

  const knownType = (value: string | null) =>
    APPROVAL_DOCUMENT_TYPES.find((type) => type === value);

  const knownStatus = (value: string | null) =>
    APPROVAL_STATUSES.find((status) => status === value);

  const myLatestAct = (row: Row) =>
    row.steps
      .filter(
        (step) =>
          step.actedBy === ME &&
          step.actedAt !== null &&
          step.status !== "PENDING",
      )
      .sort((a, b) => (b.actedAt ?? "").localeCompare(a.actedAt ?? ""))[0];

  const listRows = (url: URL) => {
    const type = knownType(url.searchParams.get("documentType"));
    const ofType = (row: Row) => !type || row.documentType === type;

    if (url.searchParams.get("menunggu") === "saya") {
      return rows
        .filter((row) => {
          const step = row.steps.find((one) => one.order === row.currentOrder);

          return (
            row.status === "PENDING" &&
            step?.status === "PENDING" &&
            canSignStep(step) &&
            row.submittedBy !== ME &&
            ofType(row)
          );
        })
        .sort(
          (a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.id - b.id,
        )
        .map(present);
    }

    if (url.searchParams.get("diproses") === "saya") {
      return rows
        .filter((row) => myLatestAct(row) && ofType(row))
        .map((row) => ({ row, act: myLatestAct(row) as Step }))
        .sort(
          (a, b) =>
            (b.act.actedAt ?? "").localeCompare(a.act.actedAt ?? "") ||
            b.row.id - a.row.id,
        )
        .map(({ row, act }) => ({
          ...present(row),
          myDecision: {
            status: act.status,
            note: act.note,
            actedAt: act.actedAt,
          },
        }));
    }

    const status = knownStatus(url.searchParams.get("status"));

    return rows
      .filter(
        (row) =>
          row.submittedBy === ME &&
          ofType(row) &&
          (!status || row.status === status),
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id - a.id)
      .map(present);
  };

  const readNote = async (request: Request) => {
    const body = await readBody<{ note?: unknown }>(request).catch(() => ({
      note: undefined,
    }));
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const message = !note
      ? "Mohon Lengkapi Alasan Penolakan"
      : note.length > 250
        ? "Alasan Penolakan tidak boleh lebih dari 250 karakter"
        : null;

    return message
      ? {
          failure: json(
            {
              status: 400,
              error: message,
              issues: [{ path: "note", message }],
            },
            400,
          ),
        }
      : { note };
  };

  const done = (message: string, row: Row) =>
    json({ status: 200, message, data: present(row) });

  const act = async (
    request: Request,
    publicId: string,
    verb: "setujui" | "tolak" | "tarik",
  ) => {
    const reason = verb === "tolak" ? await readNote(request) : null;
    if (reason?.failure) return reason.failure;

    if (process.env.MOCK_APPROVAL_ACT_ERROR) {
      return fail(500, "Kesalahan server.");
    }
    if (isRaceArmed) {
      isRaceArmed = false;
      return fail(400, "Permintaan Persetujuan Ini Sudah Selesai");
    }

    const row = rows.find((item) => item.publicId === publicId);
    if (!row) return fail(404, NOT_FOUND);

    const now = new Date().toISOString();

    if (verb === "tarik") {
      const failure = withdrawable(row);
      if (failure) return failure;

      Object.assign(row, {
        status: "CANCELLED",
        completedAt: now,
        updatedAt: now,
      });
      writeBack(row);

      return done("Berhasil Menarik Permintaan", row);
    }

    const { failure, step } = actionable(row);
    if (failure) return failure;

    Object.assign(step, {
      status: verb === "setujui" ? "APPROVED" : "REJECTED",
      note: reason?.note ?? null,
      actedBy: ME,
      actedAt: now,
    });

    if (verb === "tolak") {
      Object.assign(row, {
        status: "REJECTED",
        completedAt: now,
        updatedAt: now,
      });
      writeBack(row, reason?.note ?? null);

      return done("Berhasil Menolak Permintaan", row);
    }

    const next = row.steps.find((one) => one.order > step.order);

    Object.assign(
      row,
      next
        ? { currentOrder: next.order, updatedAt: now }
        : { status: "APPROVED", completedAt: now, updatedAt: now },
    );
    writeBack(row);

    return done("Berhasil Menyetujui Permintaan", row);
  };

  return async ({ request, url, path, method, can, isAdmin }) => {
    const match = path.match(
      /^\/persetujuan(?:\/([^/]+))?(?:\/(setujui|tolak|tarik))?$/,
    );
    if (!match) return null;

    syncDisposals();
    syncPurchaseRequests();

    const [, publicId, verb] = match;

    if (method === "PUT" && publicId && verb) {
      if (!can(MENU.PERMINTAAN_PERSETUJUAN, "UPDATE")) return denied();

      return act(request, publicId, verb as "setujui" | "tolak" | "tarik");
    }

    if (method !== "GET" || verb) return null;
    if (!can(MENU.PERMINTAAN_PERSETUJUAN, "VIEW")) return denied();

    if (!publicId) {
      if (process.env.MOCK_500) return fail(500, "Kesalahan server.");

      return list(
        listRows(url),
        url,
        "Permintaan Persetujuan",
        "Permintaan Persetujuan",
        LIST_MESSAGE,
      );
    }

    const row = rows.find((item) => item.publicId === publicId);
    if (!row || !mayRead(row, isAdmin)) return fail(404, NOT_FOUND);

    return json({
      status: 200,
      message: LIST_MESSAGE,
      data: {
        ...present(row),
        canSign: !actionable(row).failure,
        canWithdraw: withdrawable(row) === null,
      },
    });
  };
};

const persona = currentPersona();

export const permintaanPersetujuanMock = createPermintaanPersetujuanMock({
  roleUserId:
    ROLE_USERS.find((role) => role.name === persona.roleName)?.id ?? 0,
  // Tahap berbasis jabatan selalu menunjuk sebuah bapel, jadi jabatan
  // church-wide (`bapelId` null) tidak ikut mencocokkan satu tahap pun.
  positions: (PERSONA_POSITIONS[PERSONA_KEY] ?? []).filter(
    (row): row is { name: string; bapelId: number; bapel: { name: string } } =>
      row.bapelId !== null,
  ),
  jemaatName: persona.jemaatName,
});
