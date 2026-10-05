import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import { resetAnggaranStores } from "../anggaran-reset";
import {
  BUDGET_USAGE_REPORT,
  GATE_WAIVER,
  previousMonth,
} from "../anggaran-store";
import {
  CASH_EXPENSE,
  CASH_EXPENSE_SOURCE,
  TODAY,
  JOURNAL_ENTRY,
  journalOfSource,
  type CashExpenseRow,
  type JournalEntryRow,
} from "../keuangan-store";
import type { MockAction } from "../kit";
import { bapelOf } from "../pelayanan-store";

import { kasKeluarMock } from "./kas-keluar";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
  // Penolakan gerbang membawa komisi dan bulannya TERSTRUKTUR, bukan sebagai
  // angka di dalam kalimat.
  bapel?: { code: string; name: string };
  year?: number;
  month?: number;
};

const clone = (row: CashExpenseRow): CashExpenseRow => ({
  ...row,
  approvals: row.approvals.map((approval) => ({ ...approval })),
  lines: row.lines.map((line) => ({ ...line })),
  notes: row.notes.map((note) => ({ ...note })),
});

const SEED = CASH_EXPENSE.map(clone);

const cloneEntry = (row: JournalEntryRow): JournalEntryRow => ({
  ...row,
  lines: row.lines.map((line) => ({ ...line })),
});

const JOURNAL_SEED = JOURNAL_ENTRY.map(cloneEntry);

afterEach(() => {
  // Larik Anggaran dipulihkan lewat SATU modul bersama (pedoman §7.2): berkas
  // ini menulis `GATE_WAIVER` dan `BUDGET_USAGE_REPORT`, dan snapshot sendiri
  // akan merekam apa pun yang berkas lain tinggalkan. `CASH_EXPENSE` milik
  // keuangan-store, jadi ia tetap dipulihkan dari snapshot berkas ini.
  resetAnggaranStores();
  CASH_EXPENSE.splice(0, CASH_EXPENSE.length, ...SEED.map(clone));
  JOURNAL_ENTRY.splice(
    0,
    JOURNAL_ENTRY.length,
    ...JOURNAL_SEED.map(cloneEntry),
  );
  delete process.env.MOCK_NO_WORKFLOW;
  delete process.env.MOCK_PERIOD_CLOSED;
});

const onCall = async (
  method: string,
  input: string,
  body?: FormData | Record<string, unknown>,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, { method });

  // FormData happy-dom tidak bisa diserialisasi Request asli Bun.
  if (body instanceof FormData) request.formData = async () => body;
  else if (body) request.json = async () => body;

  const response = await kasKeluarMock({
    request,
    url,
    path: input.split("?")[0]!,
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const idOf = (index: number) => CASH_EXPENSE[index]!.publicId;

const PENDING_MINE = "doc-7";
const PENDING_OTHER = "doc-2";
const APPROVED = "doc-17";
const REJECTED = "doc-19";
const PAID = "doc-22";
const DRAFT_OPEN = "bkk-0006";
const CLOSED_MONTH = "bkk-0007";

const fileOf = (name = "nota.jpg", type = "image/jpeg") =>
  new File(["x"], name, { type });

const formOf = (extra: Record<string, string> = {}, files: File[] = []) => {
  const form = new FormData();
  const fields: Record<string, string> = {
    expenseDate: "2026-09-29",
    payee: "PLN UP3 Medan",
    description: "Tagihan listrik",
    paidFromAccountId: "2",
    bapelChoice: "BUKAN_KOMISI",
    lines: JSON.stringify([{ accountId: 22, amount: 1850000 }]),
    ...extra,
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== "") form.append(key, value);
  }
  for (const file of files) form.append("image", file, file.name);

  return form;
};

describe("gerbang izin", () => {
  test("setiap aksi dijaga aksinya sendiri", async () => {
    const deny = (_slug: string, action: MockAction) => action === "VIEW";

    expect((await onCall("GET", "/kas-keluar", undefined, deny))?.status).toBe(
      200,
    );
    expect((await onCall("POST", "/kas-keluar", formOf(), deny))?.status).toBe(
      403,
    );
    expect(
      (
        await onCall(
          "POST",
          `/kas-keluar/${PENDING_MINE}/pengajuan`,
          undefined,
          deny,
        )
      )?.status,
    ).toBe(403);
    expect(
      (await onCall("PUT", `/kas-keluar/${APPROVED}/bayar`, undefined, deny))
        ?.status,
    ).toBe(403);
    expect(
      (await onCall("PUT", `/kas-keluar/${PAID}/batal`, undefined, deny))
        ?.status,
    ).toBe(403);
  });

  test("batal dijaga DELETE, bukan UPDATE", async () => {
    const noDelete = (_slug: string, action: MockAction) => action !== "DELETE";

    expect(
      (await onCall("PUT", `/kas-keluar/${PAID}/batal`, undefined, noDelete))
        ?.status,
    ).toBe(403);
  });

  test("hanya menu Kas Keluar yang membuka daftar", async () => {
    const other = (slug: string) => slug !== MENU.KAS_KELUAR;

    expect((await onCall("GET", "/kas-keluar", undefined, other))?.status).toBe(
      403,
    );
  });
});

describe("daftar", () => {
  test("referensi ikut dicari", async () => {
    const found = await onCall("GET", "/kas-keluar?filter=PSN-2026-0012");

    expect((found?.body.data as { publicId: string }[])[0]!.publicId).toBe(
      PENDING_MINE,
    );
  });

  test("isPendingApproval memisahkan draf yang sudah diajukan", async () => {
    const pending = await onCall(
      "GET",
      "/kas-keluar?status=DRAFT&isPendingApproval=1",
    );
    const open = await onCall(
      "GET",
      "/kas-keluar?status=DRAFT&isPendingApproval=0",
    );
    const idsOf = (body?: Json) =>
      (body?.data as { publicId: string }[]).map((row) => row.publicId);

    expect(idsOf(pending?.body).sort()).toEqual(
      [PENDING_MINE, PENDING_OTHER].sort(),
    );
    expect(idsOf(open?.body)).toContain(DRAFT_OPEN);
    expect(idsOf(open?.body)).toContain(REJECTED);
    expect(idsOf(open?.body)).not.toContain(PENDING_MINE);
  });

  test("bacaan membawa total turunan, approval, dan programId null", async () => {
    const read = await onCall("GET", `/kas-keluar/${PENDING_OTHER}`);
    const data = read?.body.data as {
      totalAmount: string;
      programId: null;
      status: string;
      approval: { status: string; isSubmittedByViewer: boolean };
    };

    expect(data.totalAmount).toBe("4500000");
    expect(data.programId).toBeNull();
    expect(data.status).toBe("DRAFT");
    expect(data.approval.status).toBe("PENDING");
    expect(data.approval.isSubmittedByViewer).toBe(false);
  });
});

describe("kolom komisi dijawab eksplisit", () => {
  test("payload tanpa jawaban ditolak di kolomnya sendiri, tanpa code", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "" }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("bapelChoice");
    expect(rejected?.body.code).toBeUndefined();
  });

  test("ejaan kebab lama ditolak, bukan dipetakan", async () => {
    for (const spelling of ["komisi", "bukan-komisi"]) {
      const rejected = await onCall(
        "POST",
        "/kas-keluar",
        formOf({ bapelChoice: spelling }),
      );

      expect(rejected?.status).toBe(400);
      expect(rejected?.body.issues?.[0]?.path).toBe("bapelChoice");
    }

    // Ditolak, bukan diterjemahkan. Alasannya BUKAN bahwa pemetaan lama bisa
    // salah menebak — reviewer BE membuktikan cabang else-nya tidak terjangkau,
    // karena tipenya `z.infer` dari skemanya sendiri. Alasannya: satu ejaan di
    // kedua arah. Bacaan server selalu memancarkan nama enum, jadi selama kebab
    // juga diterima, klien yang mengirim balik apa yang baru saja ia baca
    // ditolak oleh field tempat ia membacanya. Menerima keduanya juga memberi
    // anggota enum ketiga sebuah pintu diam nanti.
    // Dan tidak ada baris baru yang lolos lewat ejaan lama.
    expect(
      CASH_EXPENSE.some(
        (row) =>
          row.payee === "PLN UP3 Medan" &&
          row.description === "Tagihan listrik",
      ),
    ).toBe(false);
  });

  test("untuk komisi tanpa bapelId ditolak di bapelId", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "KOMISI" }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("bapelId");
  });

  test("bukan belanja komisi dengan bapelId terisi ditolak, tanpa code", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "BUKAN_KOMISI", bapelId: "3" }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("bapelId");
    expect(rejected?.body.code).toBeUndefined();
  });

  test("ubah ikut menuntut jawaban, bukan hanya tambah", async () => {
    const rejected = await onCall(
      "PUT",
      `/kas-keluar/${REJECTED}`,
      formOf({ bapelChoice: "" }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("bapelChoice");
  });

  test("jawabannya disimpan dan dibacakan kembali, dua arah", async () => {
    const stated = await onCall("POST", "/kas-keluar", formOf());
    const komisi = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "KOMISI", bapelId: "3" }),
    );

    expect((stated?.body.data as { bapelChoice: string }).bapelChoice).toBe(
      "BUKAN_KOMISI",
    );
    expect((komisi?.body.data as { bapelChoice: string }).bapelChoice).toBe(
      "KOMISI",
    );
  });

  test("baris lama terbaca tanpa jawaban, dan tidak dikarang jadi bukan-komisi", async () => {
    const legacy = CASH_EXPENSE.find((row) => row.bapelChoice === null);
    const read = await onCall("GET", `/kas-keluar/${legacy!.publicId}`);

    expect(legacy?.bapelId).toBeNull();
    expect((read?.body.data as { bapelChoice: null }).bapelChoice).toBeNull();
  });
});

describe("tulis", () => {
  test("tambah selalu DRAFT tanpa persetujuan", async () => {
    const created = await onCall("POST", "/kas-keluar", formOf());
    const data = created?.body.data as { status: string; approval: null };

    expect(created?.status).toBe(201);
    expect(data.status).toBe("DRAFT");
    expect(data.approval).toBeNull();
  });

  test("akun sumber dana harus bertipe aset", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ paidFromAccountId: "22" }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]).toEqual({
      path: "paidFromAccountId",
      message: "Akun Harus Bertipe Aset",
    });
  });

  test("akun nonaktif ditolak per field", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ lines: JSON.stringify([{ accountId: 25, amount: 1000 }]) }),
    );

    expect(rejected?.body.issues?.[0]?.path).toBe("lines.0.accountId");
    expect(rejected?.body.issues?.[0]?.message).toContain("Tidak Aktif");
  });

  test("tanggal masa depan dan nominal nol ditolak", async () => {
    const future = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ expenseDate: "2999-01-01" }),
    );
    const zero = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ lines: JSON.stringify([{ accountId: 22, amount: 0 }]) }),
    );

    expect(future?.body.issues?.[0]?.path).toBe("expenseDate");
    expect(zero?.body.issues?.[0]?.path).toBe("lines.0.amount");
  });

  test("rincian kosong ditolak", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ lines: "[]" }),
    );

    expect(rejected?.body.issues?.[0]?.path).toBe("lines");
  });

  test("nota keempat ditolak dengan issues image", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({}, [
        fileOf("a.jpg"),
        fileOf("b.jpg"),
        fileOf("c.jpg"),
        fileOf("d.jpg"),
      ]),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]).toEqual({
      path: "image",
      message: "Nota Maksimal 3",
    });
  });

  test("keepFiles penuh plus berkas baru tetap ditolak", async () => {
    const current = CASH_EXPENSE.find((row) => row.publicId === DRAFT_OPEN)!;
    const rejected = await onCall(
      "PUT",
      `/kas-keluar/${DRAFT_OPEN}`,
      formOf(
        {
          keepFiles: JSON.stringify(
            current.notes.map((note) => ({ publicId: note.publicId })),
          ),
        },
        [fileOf()],
      ),
    );

    expect(rejected?.body.issues?.[0]?.path).toBe("image");
  });

  test("ubah dan hapus ditolak selama ada permintaan terbuka", async () => {
    const updated = await onCall(
      "PUT",
      `/kas-keluar/${PENDING_MINE}`,
      formOf(),
    );
    const deleted = await onCall("DELETE", `/kas-keluar/${PENDING_MINE}`);

    expect(updated?.status).toBe(400);
    expect(updated?.body.error).toContain("Tarik Pengajuannya");
    expect(deleted?.status).toBe(400);
  });

  test("ubah ditolak sesudah dibayar", async () => {
    expect((await onCall("PUT", `/kas-keluar/${PAID}`, formOf()))?.status).toBe(
      400,
    );
  });

  test("draf yang ditolak boleh diubah lagi", async () => {
    expect(
      (await onCall("PUT", `/kas-keluar/${REJECTED}`, formOf()))?.status,
    ).toBe(200);
  });
});

describe("ajukan dan tarik", () => {
  test("ajukan membuat permintaan tanpa mengubah status dokumen", async () => {
    const submitted = await onCall(
      "POST",
      `/kas-keluar/${DRAFT_OPEN}/pengajuan`,
    );
    const read = await onCall("GET", `/kas-keluar/${DRAFT_OPEN}`);
    const data = read?.body.data as {
      status: string;
      approval: { status: string };
    };

    expect(submitted?.status).toBe(201);
    expect(data.status).toBe("DRAFT");
    expect(data.approval.status).toBe("PENDING");
  });

  test("ajukan dua kali ditolak", async () => {
    expect(
      (await onCall("POST", `/kas-keluar/${PENDING_MINE}/pengajuan`))?.status,
    ).toBe(400);
  });

  test("tanpa alur persetujuan: ditolak dengan pesannya", async () => {
    process.env.MOCK_NO_WORKFLOW = "1";
    const rejected = await onCall(
      "POST",
      `/kas-keluar/${DRAFT_OPEN}/pengajuan`,
    );

    expect(rejected?.body.error).toBe(
      "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    );
  });

  test("tarik hanya oleh pengaju", async () => {
    const mine = await onCall("PUT", `/kas-keluar/${PENDING_MINE}/tarik`);
    const other = await onCall("PUT", `/kas-keluar/${PENDING_OTHER}/tarik`);

    expect(mine?.status).toBe(200);
    expect(other?.status).toBe(403);
    expect(
      CASH_EXPENSE.find((row) => row.publicId === PENDING_MINE)!.approvals.at(
        -1,
      )?.submittedBy,
    ).toBe(SESSION_USER_ID);
  });

  test("tarik tanpa permintaan terbuka ditolak", async () => {
    expect((await onCall("PUT", `/kas-keluar/${PAID}/tarik`))?.status).toBe(
      400,
    );
  });
});

describe("bayar", () => {
  test("hanya dari Disetujui", async () => {
    const draft = await onCall("PUT", `/kas-keluar/${DRAFT_OPEN}/bayar`);
    const paid = await onCall("PUT", `/kas-keluar/${PAID}/bayar`);

    expect(draft?.body.error).toContain("Belum Disetujui");
    expect(paid?.body.error).toContain("Sudah Dibayar");
  });

  test("menulis entri sungguhan lewat pintu bersama: kredit sumber, debit per baris", async () => {
    const before = JOURNAL_ENTRY.length;
    const payment = await onCall("PUT", `/kas-keluar/${APPROVED}/bayar`);
    const data = payment?.body.data as {
      status: string;
      journal: { code: string; status: string };
    };
    const row = CASH_EXPENSE.find((item) => item.publicId === APPROVED)!;
    const entry = journalOfSource(CASH_EXPENSE_SOURCE, row.id)!;

    expect(data.status).toBe("PAID");
    expect(JOURNAL_ENTRY.length).toBe(before + 1);
    expect(data.journal.code).toBe(entry.code);
    expect(entry.status).toBe("POSTED");
    expect(
      entry.lines.find((line) => line.accountId === row.paidFromAccountId)
        ?.credit,
    ).toBe("1250000");
    expect(entry.lines.find((line) => line.accountId === 23)?.debit).toBe(
      "1250000",
    );
  });

  test("bayar dua kali tidak menulis entri kedua", async () => {
    await onCall("PUT", `/kas-keluar/${APPROVED}/bayar`);
    const before = JOURNAL_ENTRY.length;
    await onCall("PUT", `/kas-keluar/${APPROVED}/bayar`);

    expect(JOURNAL_ENTRY.length).toBe(before);
  });

  test("bulan tertutup ditolak dengan code PERIOD_CLOSED", async () => {
    const rejected = await onCall("PUT", `/kas-keluar/${CLOSED_MONTH}/bayar`);

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.code).toBe("PERIOD_CLOSED");
    expect(rejected?.body.error).toContain("Sudah Ditutup");
  });

  test("MOCK_PERIOD_CLOSED menutup bulan berjalan juga", async () => {
    process.env.MOCK_PERIOD_CLOSED = "1";

    expect(
      (await onCall("PUT", `/kas-keluar/${APPROVED}/bayar`))?.body.code,
    ).toBe("PERIOD_CLOSED");
  });
});

describe("batalkan", () => {
  test("alasan wajib", async () => {
    const rejected = await onCall("PUT", `/kas-keluar/${PAID}/batal`, {
      cancelReason: "  ",
    });

    expect(rejected?.body.issues?.[0]?.path).toBe("cancelReason");
  });

  test("draf tidak perlu dibatalkan", async () => {
    const rejected = await onCall("PUT", `/kas-keluar/${DRAFT_OPEN}/batal`, {
      cancelReason: "salah catat",
    });

    expect(rejected?.body.error).toContain("Tidak Perlu Dibatalkan");
  });

  test("membatalkan yang sudah dibayar menulis pembalikan, bukan menghapus", async () => {
    const row = CASH_EXPENSE.find((item) => item.publicId === PAID)!;
    const original = journalOfSource(CASH_EXPENSE_SOURCE, row.id)!;
    const before = JOURNAL_ENTRY.length;

    await onCall("PUT", `/kas-keluar/${PAID}/batal`, {
      cancelReason: "Nota ganda",
    });

    const reversal = JOURNAL_ENTRY.find(
      (entry) => entry.reversalOfId === original.id,
    )!;

    expect(original.status).toBe("REVERSED");
    expect(JOURNAL_ENTRY.length).toBe(before + 1);
    expect(reversal.sourceType).toBe("MANUAL");
    expect(reversal.sourceId).toBeNull();
    expect(reversal.lines[0]!.credit).toBe(original.lines[0]!.debit);
  });

  test("membatalkan yang belum dibayar tidak menyentuh jurnal", async () => {
    const before = JOURNAL_ENTRY.length;

    await onCall("PUT", `/kas-keluar/${APPROVED}/batal`, {
      cancelReason: "Nota ganda",
    });

    expect(JOURNAL_ENTRY.length).toBe(before);
  });

  test("alasan tersimpan dan terbaca kembali", async () => {
    await onCall("PUT", `/kas-keluar/${PAID}/batal`, {
      cancelReason: "Nota  ganda, sudah lewat kas kecil",
    });
    const read = await onCall("GET", `/kas-keluar/${PAID}`);

    expect((read?.body.data as { cancelReason: string }).cancelReason).toBe(
      "Nota ganda, sudah lewat kas kecil",
    );
  });

  test("disetujui dan dibayar boleh dibatalkan sekali", async () => {
    const first = await onCall("PUT", `/kas-keluar/${APPROVED}/batal`, {
      cancelReason: "nota ganda",
    });
    const second = await onCall("PUT", `/kas-keluar/${APPROVED}/batal`, {
      cancelReason: "nota ganda",
    });

    expect((first?.body.data as { status: string }).status).toBe("CANCELLED");
    expect(second?.body.error).toContain("Sudah Dibatalkan");
  });
});

describe("bukan milik handler ini", () => {
  test("path lain dilewatkan", async () => {
    expect(await onCall("GET", "/kas-masuk")).toBeNull();
    expect(idOf(0)).toBe(PENDING_MINE);
  });
});

// Gerbangnya diuji atas prasyarat yang DINYATAKAN di sini, bukan atas keadaan
// benih: benihnya bergeser di tiap `MOCK_TODAY`, dan test yang menebak komisi
// mana yang kebetulan belum melapor akan hijau di satu tanggal dan merah di
// tanggal lain. Bulannya selalu dihitung dari TODAY, tidak pernah dituliskan.
const GATE_BAPEL = 2;

const THIS_MONTH = `${TODAY.slice(0, 7)}-15`;

const gateMonth = () =>
  previousMonth(Number(THIS_MONTH.slice(0, 4)), Number(THIS_MONTH.slice(5, 7)));

const payableOf = (bapelId: number | null, expenseDate = THIS_MONTH) => {
  const row: CashExpenseRow = {
    ...clone(CASH_EXPENSE[0]!),
    id: 9100 + CASH_EXPENSE.length,
    publicId: `bkk-gate-${CASH_EXPENSE.length}`,
    code: `BKK-GATE-${CASH_EXPENSE.length}`,
    expenseDate,
    bapelId,
    bapelChoice: bapelId === null ? "BUKAN_KOMISI" : "KOMISI",
    status: "APPROVED",
    approvals: [],
    deletedAt: null,
  };
  CASH_EXPENSE.push(row);

  return row.publicId;
};

/** Komisi yang MENERIMA pencairan di M−1 dan belum punya laporan apa pun. */
const onOweReport = (bapelId = GATE_BAPEL) => {
  const { year, month } = gateMonth();
  const live = BUDGET_USAGE_REPORT.filter(
    (row) =>
      row.bapelId === bapelId && row.year === year && row.month === month,
  );
  for (const row of live) row.deletedAt = new Date().toISOString();

  payableOf(bapelId, `${year}-${String(month).padStart(2, "0")}-10`);
  const drew = CASH_EXPENSE.at(-1)!;
  drew.status = "PAID";
};

const reportFor = (status: "DRAFT" | "APPROVED", bapelId = GATE_BAPEL) => {
  const { year, month } = gateMonth();

  BUDGET_USAGE_REPORT.push({
    ...structuredClone(BUDGET_USAGE_REPORT[0]!),
    id: 9200 + BUDGET_USAGE_REPORT.length,
    publicId: `lpb-gate-${BUDGET_USAGE_REPORT.length}`,
    code: `LPB-GATE-${BUDGET_USAGE_REPORT.length}`,
    bapelId,
    year,
    month,
    status,
    deletedAt: null,
  });
};

describe("gerbang pencairan di bayar", () => {
  test("laporan M-1 belum ada: ditolak dengan code dan bulan terstruktur", async () => {
    onOweReport();
    const id = payableOf(GATE_BAPEL);
    const rejected = await onCall("PUT", `/kas-keluar/${id}/bayar`);
    const { year, month } = gateMonth();

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.code).toBe("BUDGET_REPORT_PENDING");
    expect(rejected?.body.year).toBe(year);
    expect(rejected?.body.month).toBe(month);
    // Komisinya TERSTRUKTUR, bukan namanya di dalam kalimat: layar menautkan
    // ke laporan komisi itu tanpa mengurai prosa.
    expect(rejected?.body.bapel?.code).toBe(bapelOf(GATE_BAPEL)!.code);
    expect(rejected?.body.bapel?.name).toBeTruthy();
    expect(rejected?.body.error).not.toContain(String(month));
  });

  test("laporan M-1 masih DRAFT: ditolak", async () => {
    onOweReport();
    reportFor("DRAFT");
    const id = payableOf(GATE_BAPEL);

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.body.code).toBe(
      "BUDGET_REPORT_PENDING",
    );
  });

  test("laporan M-1 APPROVED: LOLOS", async () => {
    onOweReport();
    reportFor("APPROVED");
    const id = payableOf(GATE_BAPEL);

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.status).toBe(200);
  });

  test("nol pencairan di M-1: LOLOS, bukan ditolak", async () => {
    // Tidak ada uang keluar bulan lalu, jadi tidak ada yang terutang — walaupun
    // tidak ada laporan sama sekali. Blokir di sini akan salah secara faktual.
    const { year, month } = gateMonth();
    for (const row of CASH_EXPENSE) {
      if (
        row.bapelId === GATE_BAPEL &&
        row.expenseDate.slice(0, 7) ===
          `${year}-${String(month).padStart(2, "0")}`
      ) {
        row.deletedAt = new Date().toISOString();
      }
    }
    const id = payableOf(GATE_BAPEL);

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.status).toBe(200);
  });

  test("sudah dibebaskan: LOLOS", async () => {
    onOweReport();
    const { year, month } = gateMonth();
    GATE_WAIVER.push({
      id: 1,
      bapelId: GATE_BAPEL,
      year,
      month,
      reason: "Pengurus baru dilantik.",
      createdById: SESSION_USER_ID,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    });
    const id = payableOf(GATE_BAPEL);

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.status).toBe(200);
  });

  test("tanpa komisi: gerbang tidak pernah masuk", async () => {
    onOweReport();
    const id = payableOf(null);

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.status).toBe(200);
  });

  test("1 Januari memakai Desember tahun SEBELUMNYA", async () => {
    const year = Number(TODAY.slice(0, 4));
    // Pencairan PAID di Desember tahun lalu, laporannya tidak ada.
    const drewId = payableOf(GATE_BAPEL, `${year - 1}-12-10`);
    CASH_EXPENSE.find((row) => row.publicId === drewId)!.status = "PAID";

    const id = payableOf(GATE_BAPEL, `${year}-01-05`);
    const rejected = await onCall("PUT", `/kas-keluar/${id}/bayar`);

    expect(rejected?.body.code).toBe("BUDGET_REPORT_PENDING");
    expect(rejected?.body.year).toBe(year - 1);
    expect(rejected?.body.month).toBe(12);
  });

  test("simpan draf tetap diterima walaupun laporan M-1 draf", async () => {
    onOweReport();
    reportFor("DRAFT");
    const created = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "KOMISI", bapelId: String(GATE_BAPEL) }),
    );

    expect(created?.status).toBe(201);
  });
});

describe("pembebasan gerbang", () => {
  const body = (next: Record<string, unknown> = {}) => {
    const { year, month } = gateMonth();

    return {
      bapelId: GATE_BAPEL,
      year,
      month,
      reason: "Pengurus baru.",
      ...next,
    };
  };

  test("tanpa KAS_KELUAR UPDATE: 403", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar/pembebasan",
      body(),
      (_slug, action) => action !== "UPDATE",
    );

    expect(rejected?.status).toBe(403);
  });

  test("tanpa alasan: 400 di field reason", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar/pembebasan",
      body({ reason: "   " }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("reason");
  });

  test("dua kali untuk komisi dan bulan yang sama: 409", async () => {
    expect(
      (await onCall("POST", "/kas-keluar/pembebasan", body()))?.status,
    ).toBe(201);
    expect(
      (await onCall("POST", "/kas-keluar/pembebasan", body()))?.status,
    ).toBe(409);
  });

  test("membebaskan lalu bayar: lolos", async () => {
    onOweReport();
    reportFor("DRAFT");
    const id = payableOf(GATE_BAPEL);

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.body.code).toBe(
      "BUDGET_REPORT_PENDING",
    );

    await onCall("POST", "/kas-keluar/pembebasan", body());

    expect((await onCall("PUT", `/kas-keluar/${id}/bayar`))?.status).toBe(200);
  });

  test("alasan dikembalikan utuh, tidak dipotong", async () => {
    const reason = "A".repeat(250);
    const created = await onCall(
      "POST",
      "/kas-keluar/pembebasan",
      body({ reason }),
    );

    expect((created?.body.data as { reason: string }).reason).toBe(reason);
  });
});
