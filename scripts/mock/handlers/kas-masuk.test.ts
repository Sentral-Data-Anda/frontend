import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import { TODAY } from "../keuangan-store";
import type { MockAction } from "../kit";

import { CASH_RECEIPT, kasMasukMock } from "./kas-masuk";

type Json = {
  status: number;
  error?: string;
  code?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: Record<string, unknown>;
};

const SEED = CASH_RECEIPT.map((row) => ({ ...row, lines: [...row.lines] }));

const onReset = () =>
  CASH_RECEIPT.splice(
    0,
    CASH_RECEIPT.length,
    ...SEED.map((row) => ({ ...row, lines: [...row.lines] })),
  );

afterEach(() => {
  onReset();
  delete process.env.MOCK_PERIOD_CLOSED;
  delete process.env.MOCK_EMPTY;
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await kasMasukMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const onlyView = (_slug: string, action: MockAction) => action === "VIEW";

const VALID = {
  receiptDate: TODAY,
  payer: "Keluarga Santoso",
  description: "Sewa gedung",
  intoAccountId: 2,
  lines: [{ accountId: 20, amount: 3500000, description: "Sewa aula" }],
};

const draftId = () =>
  CASH_RECEIPT.find(
    (row) => row.status === "DRAFT" && row.receiptDate >= TODAY.slice(0, 7),
  )?.publicId ?? "";

const paidId = () =>
  CASH_RECEIPT.find((row) => row.status === "PAID")?.publicId ?? "";

const closedDraftId = () =>
  CASH_RECEIPT.find(
    (row) =>
      row.status === "DRAFT" &&
      row.receiptDate.startsWith(`${TODAY.slice(0, 4)}-01`),
  )?.publicId ?? "";

describe("guard", () => {
  test("tanpa VIEW daftar ditolak", async () => {
    const response = await onCall("GET", "/kas-masuk", undefined, () => false);

    expect(response?.status).toBe(403);
  });

  test("terima butuh UPDATE dan batal butuh DELETE", async () => {
    const receive = await onCall(
      "PUT",
      `/kas-masuk/${draftId()}/terima`,
      undefined,
      onlyView,
    );
    const cancel = await onCall(
      "PUT",
      `/kas-masuk/${paidId()}/batal`,
      { cancelReason: "salah" },
      (slug, action) => action === "UPDATE" && slug === MENU.KAS_MASUK,
    );

    expect(receive?.status).toBe(403);
    expect(cancel?.status).toBe(403);
  });
});

describe("daftar", () => {
  test("pencarian mencakup referensi", async () => {
    const response = await onCall(
      "GET",
      "/kas-masuk?filter=BA-07%2FIX%2F2026&limit=100",
    );
    const rows = (response?.body.data ?? []) as { reference: string }[];

    expect(rows).toHaveLength(1);
    expect(rows[0]?.reference).toBe("BA-07/IX/2026");
  });

  test("MOCK_EMPTY menjawab 404", async () => {
    process.env.MOCK_EMPTY = "1";

    expect((await onCall("GET", "/kas-masuk"))?.status).toBe(404);
  });
});

describe("simpan", () => {
  test("total diturunkan dari baris, tidak pernah dari body", async () => {
    const response = await onCall("POST", "/kas-masuk", {
      ...VALID,
      totalAmount: "999999999",
      lines: [
        { accountId: 20, amount: 1000000 },
        { accountId: 7, amount: 250000 },
      ],
    });

    expect(response?.status).toBe(201);
    expect(response?.body.data?.totalAmount).toBe("1250000");
    expect(response?.body.data?.status).toBe("DRAFT");
  });

  test("programId di body diabaikan dan tidak ikut bacaan", async () => {
    const response = await onCall("POST", "/kas-masuk", {
      ...VALID,
      programId: 9,
    });

    expect(JSON.stringify(response?.body.data)).not.toContain("programId");
  });

  test("akun nonaktif memberi issues pada jalur barisnya", async () => {
    const response = await onCall("POST", "/kas-masuk", {
      ...VALID,
      intoAccountId: 25,
      lines: [{ accountId: 25, amount: 1000 }],
    });
    const paths = response?.body.issues?.map((issue) => issue.path);

    expect(response?.status).toBe(400);
    expect(paths).toContain("intoAccountId");
    expect(paths).toContain("lines.0.accountId");
  });

  test("nominal nol dan rincian kosong ditolak", async () => {
    const zero = await onCall("POST", "/kas-masuk", {
      ...VALID,
      lines: [{ accountId: 20, amount: 0 }],
    });
    const none = await onCall("POST", "/kas-masuk", { ...VALID, lines: [] });

    expect(zero?.body.issues?.[0]?.path).toBe("lines.0.amount");
    expect(none?.body.issues?.map((issue) => issue.path)).toContain("lines");
  });

  test("tanggal di masa depan ditolak", async () => {
    const response = await onCall("POST", "/kas-masuk", {
      ...VALID,
      receiptDate: "2999-01-01",
    });

    expect(response?.body.issues?.[0]?.path).toBe("receiptDate");
  });

  test("ubah dan hapus hanya untuk draf", async () => {
    const id = paidId();

    expect((await onCall("PUT", `/kas-masuk/${id}`, VALID))?.status).toBe(400);
    expect((await onCall("DELETE", `/kas-masuk/${id}`))?.status).toBe(400);
  });

  test("hapus draf menghilangkannya dari daftar", async () => {
    const id = draftId();

    expect((await onCall("DELETE", `/kas-masuk/${id}`))?.status).toBe(200);
    expect((await onCall("GET", `/kas-masuk/${id}`))?.status).toBe(404);
  });
});

describe("terima", () => {
  test("mencatat jurnal dan menolak percobaan kedua", async () => {
    const id = draftId();
    const first = await onCall("PUT", `/kas-masuk/${id}/terima`);
    const second = await onCall("PUT", `/kas-masuk/${id}/terima`);

    expect(first?.body.data?.status).toBe("PAID");
    expect(first?.body.data?.journal).toMatchObject({ status: "POSTED" });
    expect(second?.status).toBe(400);
  });

  test("bulan tertutup ditolak dengan code PERIOD_CLOSED", async () => {
    const response = await onCall(
      "PUT",
      `/kas-masuk/${closedDraftId()}/terima`,
    );

    expect(response?.status).toBe(400);
    expect(response?.body.code).toBe("PERIOD_CLOSED");
    expect(response?.body.error).toContain("Sudah Ditutup");
  });

  test("MOCK_PERIOD_CLOSED menolak bulan yang masih terbuka", async () => {
    process.env.MOCK_PERIOD_CLOSED = "1";

    const response = await onCall("PUT", `/kas-masuk/${draftId()}/terima`);

    expect(response?.body.code).toBe("PERIOD_CLOSED");
  });
});

describe("batal", () => {
  test("alasan wajib", async () => {
    const response = await onCall("PUT", `/kas-masuk/${paidId()}/batal`, {});

    expect(response?.status).toBe(400);
    expect(response?.body.issues?.[0]?.path).toBe("cancelReason");
  });

  test("hanya dari Diterima", async () => {
    const response = await onCall("PUT", `/kas-masuk/${draftId()}/batal`, {
      cancelReason: "salah catat",
    });

    expect(response?.status).toBe(400);
  });

  test("membatalkan yang sudah diterima", async () => {
    const response = await onCall("PUT", `/kas-masuk/${paidId()}/batal`, {
      cancelReason: "Uang dikembalikan",
    });

    expect(response?.body.data?.status).toBe("CANCELLED");
    expect(response?.body.data?.cancelReason).toBe("Uang dikembalikan");
  });
});

describe("bacaan", () => {
  test("tidak menyebut debit maupun kredit", async () => {
    const response = await onCall("GET", `/kas-masuk/${paidId()}`);
    const body = JSON.stringify(response?.body).toLowerCase();

    expect(body).not.toContain("debit");
    expect(body).not.toContain("credit");
    expect(body).not.toContain("kredit");
  });

  test("id yang tidak ada menjawab 404", async () => {
    expect((await onCall("GET", "/kas-masuk/bkm-9999"))?.status).toBe(404);
  });
});
