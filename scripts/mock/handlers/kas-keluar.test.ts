import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  CASH_EXPENSE,
  CASH_EXPENSE_SOURCE,
  JOURNAL_ENTRY,
  journalOfSource,
  type CashExpenseRow,
  type JournalEntryRow,
} from "../keuangan-store";
import type { MockAction } from "../kit";

import { kasKeluarMock } from "./kas-keluar";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
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
    bapelChoice: "bukan-komisi",
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

  test("untuk komisi tanpa bapelId ditolak di bapelId", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "komisi" }),
    );

    expect(rejected?.status).toBe(400);
    expect(rejected?.body.issues?.[0]?.path).toBe("bapelId");
  });

  test("bukan belanja komisi dengan bapelId terisi ditolak, tanpa code", async () => {
    const rejected = await onCall(
      "POST",
      "/kas-keluar",
      formOf({ bapelChoice: "bukan-komisi", bapelId: "3" }),
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
      formOf({ bapelChoice: "komisi", bapelId: "3" }),
    );

    expect((stated?.body.data as { bapelChoice: string }).bapelChoice).toBe(
      "bukan-komisi",
    );
    expect((komisi?.body.data as { bapelChoice: string }).bapelChoice).toBe(
      "komisi",
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
